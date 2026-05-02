const supabase = require("../supabaseClient");

function computeStatus(start_date, end_date, is_confirmed) {
  if (!start_date) return "PLANNING";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(start_date);
  const end = end_date ? new Date(end_date) : new Date(start_date);

  if (end < today) return "PAST";
  if (start <= today && end >= today) return "ONGOING";
  if (is_confirmed) return "CONFIRMED";
  return "PLANNING";
}

async function getTripsByUser(userId, filter = "all") {
  const { data: memberRows, error: memberErr } = await supabase
    .from("trip_members")
    .select("trip_id, role")
    .eq("user_id", userId);

  if (memberErr) throw new Error(memberErr.message);
  if (!memberRows.length) return [];

  const tripIds = memberRows.map((r) => r.trip_id);

  const { data: trips, error: tripsErr } = await supabase
    .from("trips")
    .select(
      "id, name, destination, cover_url, start_date, end_date, created_at, is_confirmed",
    )
    .in("id", tripIds)
    .order("created_at", { ascending: false });

  if (tripsErr) throw new Error(tripsErr.message);

  const { data: allMembers } = await supabase
    .from("trip_members")
    .select("trip_id, role, users ( id, full_name, avatar_url )")
    .in("trip_id", tripIds);

  const membersByTrip = {};
  for (const m of allMembers || []) {
    if (!membersByTrip[m.trip_id]) membersByTrip[m.trip_id] = [];
    membersByTrip[m.trip_id].push({ role: m.role, ...m.users });
  }

  let result = trips.map((trip) => ({
    ...trip,
    status: computeStatus(trip.start_date, trip.end_date, trip.is_confirmed),
    members: membersByTrip[trip.id] || [],
    role: memberRows.find((r) => r.trip_id === trip.id)?.role || "viewer",
  }));

  if (filter === "upcoming") {
    result = result.filter(
      (t) =>
        t.status === "CONFIRMED" ||
        t.status === "PLANNING" ||
        t.status === "ONGOING",
    );
  }

  if (filter === "past") {
    result = result.filter((t) => t.status === "PAST");
  }

  return result;
}

async function getTripById(tripId) {
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (tripErr) throw new Error(tripErr.message);

  return trip;
}

async function createTrip(
  userId,
  { name, destination, cover_url, start_date, end_date },
) {
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .insert({
      name,
      destination,
      cover_url,
      start_date: start_date || null,
      end_date: end_date || null,
      is_confirmed: false,
    })
    .select()
    .single();

  if (tripErr) throw new Error(tripErr.message);

  const { error: memberErr } = await supabase
    .from("trip_members")
    .insert({ trip_id: trip.id, user_id: userId, role: "owner" });

  if (memberErr) throw new Error(memberErr.message);

  return trip;
}

async function deleteTrip(userId, tripId) {
  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .single();

  if (!membership || membership.role !== "owner") throw new Error("FORBIDDEN");

  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw new Error(error.message);

  return true;
}

module.exports = { getTripsByUser, createTrip, deleteTrip, getTripById };

const supabase = require("../supabaseClient");

function generateInviteCode() {
  return Math.random().toString(16).slice(2, 10);
}

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

async function getMembersByTripIds(tripIds) {
  const { data: memberRows, error: membersErr } = await supabase
    .from("trip_members")
    .select("trip_id, user_id, role, joined_at")
    .in("trip_id", tripIds);

  if (membersErr) throw new Error(membersErr.message);

  const userIds = [...new Set((memberRows || []).map((member) => member.user_id))];
  const { data: profiles, error: profilesErr } = userIds.length
    ? await supabase
        .from("users")
        .select("id, full_name, avatar_url, email")
        .in("id", userIds)
    : { data: [], error: null };

  if (profilesErr) throw new Error(profilesErr.message);

  const profilesById = {};
  for (const profile of profiles || []) {
    profilesById[profile.id] = profile;
  }

  const membersByTrip = {};
  for (const member of memberRows || []) {
    if (!membersByTrip[member.trip_id]) membersByTrip[member.trip_id] = [];
    membersByTrip[member.trip_id].push({
      id: member.user_id,
      role: member.role,
      full_name:
        profilesById[member.user_id]?.full_name ||
        profilesById[member.user_id]?.email?.split("@")[0] ||
        "User",
      avatar_url: profilesById[member.user_id]?.avatar_url || null,
      email: profilesById[member.user_id]?.email || null,
      joined_at: member.joined_at || null,
    });
  }

  return membersByTrip;
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

  const membersByTrip = await getMembersByTripIds(tripIds);

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

 const { count, error: countErr } = await supabase
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);
  if (countErr) throw new Error(countErr.message);

  const membersByTrip = await getMembersByTripIds([tripId]);

  return {
    ...trip,
    membersCount: count ?? 0,
    members: membersByTrip[tripId] || [],
  };
}

async function createTrip(
  userId,
  { name, destination, cover_url, start_date, end_date },
) {
  let trip;
  let tripErr;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await supabase
      .from("trips")
      .insert({
        name,
        destination,
        cover_url,
        start_date: start_date || null,
        end_date: end_date || null,
        invite_code: generateInviteCode(),
        is_confirmed: false,
      })
      .select()
      .single();

    trip = result.data;
    tripErr = result.error;

    if (!tripErr) break;
    if (tripErr.code !== "23505") break;
  }

  if (tripErr) throw new Error(tripErr.message);

  const { error: memberErr } = await supabase
    .from("trip_members")
    .insert({ trip_id: trip.id, user_id: userId, role: "owner" });

  if (memberErr) {
    await supabase.from("trips").delete().eq("id", trip.id);
    throw new Error(memberErr.message);
  }

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

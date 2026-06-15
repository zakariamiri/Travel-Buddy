const supabase = require("../supabaseClient");

function computeStatus(start_date, end_date, is_confirmed) {
  if (!start_date) return "PLANNING";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = end_date ? new Date(end_date) : new Date(start_date);
  if (end < today) return "PAST";
  if (is_confirmed) return "CONFIRMED";
  return "PLANNING";
}

async function getTripsByUser(userId, filter = "all") {
  try {
    if (!userId) throw new Error("User ID is required");
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
    if (filter === "upcoming")
      result = result.filter((t) => t.status !== "PAST");
    if (filter === "past") result = result.filter((t) => t.status === "PAST");
    return result;
  } catch (error) {
    console.error("Error in getTripsByUser:", error);
    throw error;
  }
}

async function createTrip(
  userId,
  { name, destination, cover_url, start_date, end_date },
) {
  try {
    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .insert({
        name,
        destination,
        cover_url,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();
    if (tripErr) throw new Error(tripErr.message);
    await supabase
      .from("trip_members")
      .insert({ trip_id: trip.id, user_id: userId, role: "owner" });
    return trip;
  } catch (error) {
    console.error("Error in createTrip:", error);
    throw error;
  }
}

async function deleteTrip(userId, tripId) {
  try {
    const { data: membership } = await supabase
      .from("trip_members")
      .select("role")
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .single();
    if (!membership || membership.role !== "owner")
      throw new Error("FORBIDDEN");
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.error("Error in deleteTrip:", error);
    throw error;
  }
}

async function getStats(userId) {
  try {
    const { data: memberRows, error: memberErr } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", userId);
    if (memberErr) throw new Error(memberErr.message);
    if (!memberRows?.length)
      return { activeTrip: null, pendingSplit: 0, daysUntilNextTrip: null };

    const tripIds = memberRows.map((r) => r.trip_id);

    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select("id, name, start_date, end_date, is_confirmed")
      .in("id", tripIds);
    if (tripsErr) throw new Error(tripsErr.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCandidates = (trips || [])
      .filter((trip) => {
        if (!trip.start_date) return false;
        const end = trip.end_date
          ? new Date(trip.end_date)
          : new Date(trip.start_date);
        return end >= today;
      })
      .sort((a, b) => {
        const aStart = new Date(a.start_date);
        const bStart = new Date(b.start_date);
        const aOngoing = aStart <= today;
        const bOngoing = bStart <= today;

        if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
        return aStart - bStart;
      });

    const activeTrip = activeCandidates[0] || null;
    const futureTrips = activeCandidates
      .filter((trip) => new Date(trip.start_date) > today)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    const nextFutureTrip = futureTrips[0] || null;

    let daysUntilNextTrip = null;
    if (nextFutureTrip) {
      const diff = new Date(nextFutureTrip.start_date) - today;
      daysUntilNextTrip = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    let collaborators = 0;
    if (activeTrip) {
      const { data: members } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", activeTrip.id);
      collaborators = members?.length || 0;
    }

    const { data: expenses } = activeTrip
      ? await supabase
          .from("expenses")
          .select("amount")
          .eq("trip_id", activeTrip.id)
      : { data: [] };
    const pendingSplit = (expenses || []).reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    return {
      activeTrip: activeTrip
        ? {
            id: activeTrip.id,
            name: activeTrip.name,
            start_date: activeTrip.start_date,
            daysUntilStart: Math.max(
              0,
              Math.ceil(
                (new Date(activeTrip.start_date) - today) /
                  (1000 * 60 * 60 * 24),
              ),
            ),
            collaborators,
          }
        : null,
      pendingSplit,
      daysUntilNextTrip,
    };
  } catch (error) {
    console.error("Error in getStats:", error);
    throw error;
  }
}

module.exports = { getTripsByUser, createTrip, deleteTrip, getStats };

const supabase = require("../supabaseClient");

function createInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function generateInviteCode(tripId) {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = createInviteCode();
    const { data, error } = await supabase
      .from("trips")
      .update({ invite_code: inviteCode })
      .eq("id", tripId)
      .select("invite_code")
      .single();

    lastError = error;

    if (!error) return data.invite_code;
    if (error.code !== "23505") break;
  }

  throw new Error(lastError?.message || "Unable to generate invite code");
}

async function getInviteCode(tripId, userId) {
  const { data: membership, error: membershipError } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership || membership.role !== "owner") {
    throw new Error("FORBIDDEN");
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("invite_code")
    .eq("id", tripId)
    .single();

  if (tripError) throw new Error(tripError.message);

  return trip.invite_code || generateInviteCode(tripId);
}

async function joinTripByCode(inviteCode, userId) {
  if (!inviteCode?.trim()) throw new Error("INVITE_CODE_REQUIRED");

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name, destination, cover_url, start_date, end_date")
    .eq("invite_code", inviteCode.trim())
    .single();

  if (tripError || !trip) throw new Error("INVALID_INVITE_CODE");

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("trip_members")
    .select("trip_id, user_id, role")
    .eq("trip_id", trip.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMemberError) throw new Error(existingMemberError.message);
  if (existingMember) return trip;

  const { error: memberError } = await supabase.from("trip_members").insert({
    trip_id: trip.id,
    user_id: userId,
    role: "contributor",
    joined_at: new Date().toISOString(),
  });

  if (memberError) throw new Error(memberError.message);

  return trip;
}

async function getTripMembers(tripId) {
  const { data: memberRows, error: membersError } = await supabase
    .from("trip_members")
    .select("user_id, role, joined_at")
    .eq("trip_id", tripId);

  if (membersError) throw new Error(membersError.message);
  if (!memberRows?.length) return [];

  const userIds = [...new Set(memberRows.map((row) => row.user_id))];

  // Fetch from auth.users via admin API
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw new Error(usersError.message);

  const usersById = {};
  for (const user of users) {
    if (userIds.includes(user.id)) {
      usersById[user.id] = user;
    }
  }

  return memberRows
    .map((row) => {
      const user = usersById[row.user_id];
      return {
        role: row.role,
        joined_at: row.joined_at,
        id: user?.id || row.user_id,
        full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
        avatar_url: user?.user_metadata?.avatar_url || null,
        email: user?.email || null,
      };
    })
    .sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (a.role !== "owner" && b.role === "owner") return 1;
      return new Date(a.joined_at || 0) - new Date(b.joined_at || 0);
    });
}
module.exports = {
  generateInviteCode,
  getInviteCode,
  joinTripByCode,
  getTripMembers,
};

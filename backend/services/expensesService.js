const supabase = require("../supabaseClient");

async function assertTripMember(tripId, userId) {
  const { data, error } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("FORBIDDEN");
}

async function getTripMemberIds(tripId) {
  const { data, error } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId);

  if (error) throw new Error(error.message);
  return new Set((data || []).map((member) => member.user_id));
}

async function getExpensesByTrip(tripId, userId) {
  await assertTripMember(tripId, userId);

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

async function createExpense(
  tripId,
  userId,
  { label, amount, paid_by, shared_payment, category, date, split_between },
) {
  await assertTripMember(tripId, userId);
  const memberIds = await getTripMemberIds(tripId);

  if (!shared_payment && !memberIds.has(paid_by)) {
    throw new Error("INVALID_PAYER");
  }

  const validSplit = Array.isArray(split_between)
    ? [...new Set(split_between)].filter((id) => memberIds.has(id))
    : [];

  const payload = {
    trip_id: tripId,
    label,
    amount,
    paid_by: shared_payment ? null : paid_by,
    category: category || "General",
    split_between: validSplit.length ? validSplit : [...memberIds],
    date,
  };

  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteExpense(tripId, expenseId, userId) {
  await assertTripMember(tripId, userId);

  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("trip_id", tripId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("NOT_FOUND");
  return data;
}

async function updateExpense(
  tripId,
  expenseId,
  userId,
  { label, amount, paid_by, shared_payment, category, date, split_between },
) {
  await assertTripMember(tripId, userId);
  const memberIds = await getTripMemberIds(tripId);

  if (!shared_payment && !memberIds.has(paid_by)) {
    throw new Error("INVALID_PAYER");
  }

  const validSplit = Array.isArray(split_between)
    ? [...new Set(split_between)].filter((id) => memberIds.has(id))
    : [];

  const { data, error } = await supabase
    .from("expenses")
    .update({
      label,
      amount,
      paid_by: shared_payment ? null : paid_by,
      category: category || "General",
      split_between: validSplit.length ? validSplit : [...memberIds],
      date,
    })
    .eq("id", expenseId)
    .eq("trip_id", tripId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("NOT_FOUND");
  return data;
}

async function getSettlementsByTrip(tripId, userId) {
  await assertTripMember(tripId, userId);

  const { data, error } = await supabase
    .from("expense_settlements")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error?.code === "PGRST205") {
    throw new Error("SETTLEMENTS_NOT_CONFIGURED");
  }
  if (error) throw new Error(error.message);
  return data || [];
}

async function createSettlement(tripId, userId, { paid_by, paid_to, amount }) {
  await assertTripMember(tripId, userId);
  const memberIds = await getTripMemberIds(tripId);

  if (!memberIds.has(paid_by) || !memberIds.has(paid_to) || paid_by === paid_to) {
    throw new Error("INVALID_SETTLEMENT");
  }

  const { data, error } = await supabase
    .from("expense_settlements")
    .insert({ trip_id: tripId, paid_by, paid_to, amount })
    .select()
    .single();

  if (error?.code === "PGRST205") {
    throw new Error("SETTLEMENTS_NOT_CONFIGURED");
  }
  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  getExpensesByTrip,
  createExpense,
  updateExpense,
  deleteExpense,
  getSettlementsByTrip,
  createSettlement,
};

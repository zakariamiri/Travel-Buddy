const supabase = require("../supabaseClient");

async function getExpensesByTrip(tripId) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

async function createExpense(tripId, { label, amount, paid_by, category, date, split_between }) {
  const payload = {
    trip_id: tripId,
    label,
    amount,
    paid_by,
    split_between: Array.isArray(split_between) ? split_between : [],
    date,
  };

  if (category) {
    payload.category = category;
  }

  let { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select()
    .single();

  if (error && error.code === "PGRST204" && error.message?.includes("category")) {
    delete payload.category;
    const retry = await supabase
      .from("expenses")
      .insert(payload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  getExpensesByTrip,
  createExpense,
};

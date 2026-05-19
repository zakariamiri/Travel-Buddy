const expensesService = require("../services/expensesService");

async function getExpensesByTrip(req, res) {
  try {
    const expenses = await expensesService.getExpensesByTrip(req.params.tripId);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createExpense(req, res) {
  try {
    const { label, title, amount, paid_by, category, date, split_between } = req.body;

    if (!(label || title) || !amount || !paid_by || !date) {
      return res.status(400).json({ error: "All expense fields are required" });
    }

    const expense = await expensesService.createExpense(req.params.tripId, {
      label: label || title,
      amount: Number(amount),
      paid_by,
      category,
      date,
      split_between,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getExpensesByTrip,
  createExpense,
};

const expensesService = require("../services/expensesService");

async function getExpensesByTrip(req, res) {
  try {
    const expenses = await expensesService.getExpensesByTrip(
      req.params.tripId,
      req.user.id,
    );
    res.json(expenses);
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function createExpense(req, res) {
  try {
    const {
      label,
      title,
      amount,
      paid_by,
      shared_payment,
      category,
      date,
      split_between,
    } = req.body;

    const numericAmount = Number(amount);
    if (
      !(label || title)?.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      (!shared_payment && !paid_by) ||
      !date
    ) {
      return res.status(400).json({ error: "All expense fields are required" });
    }

    const expense = await expensesService.createExpense(req.params.tripId, req.user.id, {
      label: label || title,
      amount: numericAmount,
      paid_by: shared_payment ? null : paid_by,
      shared_payment: Boolean(shared_payment),
      category,
      date,
      split_between,
    });
    res.status(201).json(expense);
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
    }
    if (err.message === "INVALID_PAYER") {
      return res.status(400).json({ error: "Le payeur doit etre membre du voyage" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function deleteExpense(req, res) {
  try {
    await expensesService.deleteExpense(
      req.params.tripId,
      req.params.expenseId,
      req.user.id,
    );
    res.json({ success: true });
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
    }
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Depense introuvable" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function updateExpense(req, res) {
  try {
    const {
      label,
      title,
      amount,
      paid_by,
      shared_payment,
      category,
      date,
      split_between,
    } = req.body;
    const numericAmount = Number(amount);

    if (
      !(label || title)?.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      (!shared_payment && !paid_by) ||
      !date
    ) {
      return res.status(400).json({ error: "All expense fields are required" });
    }

    const expense = await expensesService.updateExpense(
      req.params.tripId,
      req.params.expenseId,
      req.user.id,
      {
        label: label || title,
        amount: numericAmount,
        paid_by: shared_payment ? null : paid_by,
        shared_payment: Boolean(shared_payment),
        category,
        date,
        split_between,
      },
    );
    res.json(expense);
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
    }
    if (err.message === "INVALID_PAYER") {
      return res.status(400).json({ error: "Le payeur doit etre membre du voyage" });
    }
    if (err.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Depense introuvable" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function getSettlements(req, res) {
  try {
    const settlements = await expensesService.getSettlementsByTrip(
      req.params.tripId,
      req.user.id,
    );
    res.json(settlements);
  } catch (err) {
    if (err.message === "SETTLEMENTS_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "La table expense_settlements doit etre creee dans Supabase",
        code: "SETTLEMENTS_NOT_CONFIGURED",
      });
    }
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
    }
    res.status(500).json({ error: err.message });
  }
}

async function createSettlement(req, res) {
  try {
    const amount = Number(req.body.amount);
    if (!req.body.paid_by || !req.body.paid_to || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Reglement invalide" });
    }

    const settlement = await expensesService.createSettlement(
      req.params.tripId,
      req.user.id,
      {
        paid_by: req.body.paid_by,
        paid_to: req.body.paid_to,
        amount,
      },
    );
    res.status(201).json(settlement);
  } catch (err) {
    if (err.message === "SETTLEMENTS_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "La table expense_settlements doit etre creee dans Supabase",
        code: "SETTLEMENTS_NOT_CONFIGURED",
      });
    }
    if (err.message === "INVALID_SETTLEMENT") {
      return res.status(400).json({ error: "Les membres du reglement sont invalides" });
    }
    if (err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "Vous n'etes pas membre de ce voyage" });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getExpensesByTrip,
  createExpense,
  updateExpense,
  deleteExpense,
  getSettlements,
  createSettlement,
};

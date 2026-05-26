const express = require("express");
const router = express.Router({ mergeParams: true });
const requireAuth = require("../middleware/auth");
const expensesController = require("../controllers/expensesController");

router.get("/", requireAuth, expensesController.getExpensesByTrip);
router.post("/", requireAuth, expensesController.createExpense);

module.exports = router;

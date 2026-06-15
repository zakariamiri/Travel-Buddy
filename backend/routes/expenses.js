const express = require("express");
const router = express.Router({ mergeParams: true });
const requireAuth = require("../middleware/auth");
const expensesController = require("../controllers/expensesController");

router.get("/", requireAuth, expensesController.getExpensesByTrip);
router.post("/", requireAuth, expensesController.createExpense);
router.get("/settlements/list", requireAuth, expensesController.getSettlements);
router.post("/settlements", requireAuth, expensesController.createSettlement);
router.put("/:expenseId", requireAuth, expensesController.updateExpense);
router.delete("/:expenseId", requireAuth, expensesController.deleteExpense);

module.exports = router;

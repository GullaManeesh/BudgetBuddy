const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const expenseSchema = {
  ExpenseName: String,
  ExpenseAmount: Number,
  CreatedDate: { type: Date, default: Date.now },
  BudgetName: String,
  CreatedBy: String,
  Budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Budgets",
  },
};

module.exports = mongoose.model("Expenses", expenseSchema);

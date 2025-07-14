const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

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
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
};

module.exports = mongoose.model("Expenses", expenseSchema);

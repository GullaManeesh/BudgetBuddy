const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

const BudgetSchema = new mongoose.Schema({
  BudgetName: String,
  BudgetAmount: Number,
  createdBy: String,
  icon: {
    type: String,
    default: "😊",
  },
  BudgetSpent: { type: Number, default: 0 },
  BudgetRemaining: Number,
  User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  expenses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expenses",
    },
  ],
});

module.exports = mongoose.model("Budgets", BudgetSchema);

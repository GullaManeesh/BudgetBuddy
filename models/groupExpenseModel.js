const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const GroupExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paidBy: { type: String, required: true },
  splitOption: { type: String, enum: ["equal", "manual"], required: true },
  splits: [
    {
      member: String,
      amount: Number,
    },
  ],
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Groups",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GroupExpenses", GroupExpenseSchema);

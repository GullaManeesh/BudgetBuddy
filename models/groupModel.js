const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const groupSchema = new mongoose.Schema({
  groupName: String,

  members: [
    {
      name: String,
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupExpenses" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Groups", groupSchema);

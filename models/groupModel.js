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
  settlements: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
      amount: {
        type: Number,
        required: true,
        get: (v) => Math.round(v),
        set: (v) => Math.round(v),
      },
      paymentMethod: {
        type: String,
        required: true,
        enum: ["cash", "bank", "upi", "other"],
      },
      date: { type: Date, required: true },
      note: String,
      settledAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Groups", groupSchema);

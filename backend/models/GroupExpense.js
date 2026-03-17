const mongoose = require("mongoose");

const splitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, min: 0 },
    shares: { type: Number, min: 0 },
  },
  { _id: false },
);

const groupExpenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    icon: { type: String, default: "💸" },
    description: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage", "shares"],
      default: "equal",
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    splits: { type: [splitSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("GroupExpense", groupExpenseSchema);

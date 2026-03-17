const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "💰" },
    amount: { type: Number, required: true, min: 0 },
    color: { type: String, default: "#a855f7" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Budget", budgetSchema);

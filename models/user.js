const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  budgets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budgets",
    },
  ],
});

module.exports = mongoose.model("Users", userSchema);

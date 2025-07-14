const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  budgets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budgets",
    },
  ],
  reminders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
    },
  ],
});

module.exports = mongoose.model("Users", userSchema);

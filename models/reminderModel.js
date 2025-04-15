const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/BudgetBuddy");

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  title: String,
  frequency: {
    type: String,
    enum: ["everyminute", "daily", "weekly", "monthly"],
    required: true,
  },
  day: Number,
  date: Number,
  time: String,
  nextReminderDate: { type: Date, required: true },
  email: String,
});

module.exports = mongoose.model("Reminder", reminderSchema);

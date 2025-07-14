const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  title: String,
  description: String,
  frequency: {
    type: String,
    enum: ["everyminute", "daily", "custom", "weekly", "monthly"],
    required: true,
  },
  customDays: Number, // For custom day intervals
  day: Number, // For weekly
  date: Number, // For monthly
  time: String,
  nextReminderDate: { type: Date, required: true, index: true },
  email: String,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Reminder", reminderSchema);

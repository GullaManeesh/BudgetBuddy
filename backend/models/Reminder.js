const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, default: "", trim: true, maxlength: 800 },
    frequency: {
      type: String,
      enum: ["minute", "hour", "day", "month", "custom"],
      required: true,
    },
    customDates: [{ type: Date }],
    nextCustomDateIndex: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    nextRunAt: { type: Date, default: null },
    lastSentAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Reminder", reminderSchema);

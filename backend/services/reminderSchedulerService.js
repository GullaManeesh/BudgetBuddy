const cron = require("node-cron");
const Reminder = require("../models/Reminder");
const { sendReminderEmail } = require("./emailService");

const addInterval = (fromDate, frequency) => {
  const next = new Date(fromDate);

  if (frequency === "minute") next.setMinutes(next.getMinutes() + 1);
  if (frequency === "hour") next.setHours(next.getHours() + 1);
  if (frequency === "day") next.setDate(next.getDate() + 1);
  if (frequency === "month") next.setMonth(next.getMonth() + 1);

  return next;
};

const computeNextRunAfterSuccess = (reminder) => {
  const now = new Date();

  if (reminder.frequency === "custom") {
    const customDates = (reminder.customDates || []).sort((a, b) => a - b);
    const nextIndex = customDates.findIndex((date) => date > now);

    if (nextIndex === -1) {
      return {
        nextRunAt: null,
        nextCustomDateIndex: reminder.nextCustomDateIndex,
        isActive: false,
      };
    }

    return {
      nextRunAt: customDates[nextIndex],
      nextCustomDateIndex: nextIndex,
      isActive: true,
    };
  }

  return {
    nextRunAt: addInterval(now, reminder.frequency),
    nextCustomDateIndex: reminder.nextCustomDateIndex,
    isActive: true,
  };
};

const processDueReminders = async () => {
  const now = new Date();

  const dueReminders = await Reminder.find({
    isActive: true,
    nextRunAt: { $ne: null, $lte: now },
  }).populate("user", "email name");

  for (const reminder of dueReminders) {
    try {
      if (!reminder.user?.email) {
        reminder.lastError = "User has no email";
        await reminder.save();
        continue;
      }

      const emailResult = await sendReminderEmail({
        toEmail: reminder.user.email,
        userName: reminder.user.name,
        reminderTitle: reminder.title,
        reminderMessage: reminder.message,
        frequency: reminder.frequency,
      });

      if (!emailResult?.sent) {
        throw new Error(emailResult?.reason || "Mailer is not configured");
      }

      const nextRun = computeNextRunAfterSuccess(reminder);
      reminder.lastSentAt = now;
      reminder.lastError = "";
      reminder.nextRunAt = nextRun.nextRunAt;
      reminder.nextCustomDateIndex = nextRun.nextCustomDateIndex;
      reminder.isActive = nextRun.isActive;

      await reminder.save();
    } catch (error) {
      reminder.lastError = error.message || "Failed to send reminder email";
      await reminder.save();
    }
  }
};

const startReminderScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      await processDueReminders();
    } catch (error) {}
  });
};

module.exports = { startReminderScheduler };

const Reminder = require("../models/Reminder");

const ALLOWED_FREQUENCIES = ["minute", "hour", "day", "month", "custom"];

const parseCustomDates = (customDates) => {
  if (!Array.isArray(customDates)) return [];

  return customDates
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
};

const buildSchedule = ({ frequency, customDates, startAt }) => {
  if (!ALLOWED_FREQUENCIES.includes(frequency)) {
    return { error: "Invalid frequency value" };
  }

  const now = new Date();
  const normalizedStartAt = startAt ? new Date(startAt) : now;
  if (Number.isNaN(normalizedStartAt.getTime())) {
    return { error: "Invalid startAt date" };
  }

  if (frequency === "custom") {
    const sortedCustomDates = parseCustomDates(customDates);
    if (!sortedCustomDates.length) {
      return { error: "customDates is required for custom frequency" };
    }

    const nextIndex = sortedCustomDates.findIndex((date) => date >= now);
    if (nextIndex === -1) {
      return { error: "All custom reminder dates are in the past" };
    }

    return {
      frequency,
      customDates: sortedCustomDates,
      nextCustomDateIndex: nextIndex,
      nextRunAt: sortedCustomDates[nextIndex],
    };
  }

  return {
    frequency,
    customDates: [],
    nextCustomDateIndex: 0,
    nextRunAt: normalizedStartAt,
  };
};

const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createReminder = async (req, res) => {
  try {
    const { title, message, frequency, customDates, startAt } = req.body;

    if (!title || !frequency) {
      return res
        .status(400)
        .json({ message: "title and frequency are required" });
    }

    const schedule = buildSchedule({ frequency, customDates, startAt });
    if (schedule.error) {
      return res.status(400).json({ message: schedule.error });
    }

    const reminder = await Reminder.create({
      user: req.user.id,
      title,
      message: message || "",
      frequency: schedule.frequency,
      customDates: schedule.customDates,
      nextCustomDateIndex: schedule.nextCustomDateIndex,
      nextRunAt: schedule.nextRunAt,
      isActive: true,
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const { title, message, frequency, customDates, startAt, isActive } =
      req.body;

    if (title !== undefined) reminder.title = title;
    if (message !== undefined) reminder.message = message;
    if (isActive !== undefined) reminder.isActive = Boolean(isActive);

    if (
      frequency !== undefined ||
      customDates !== undefined ||
      startAt !== undefined
    ) {
      const schedule = buildSchedule({
        frequency: frequency || reminder.frequency,
        customDates:
          customDates !== undefined ? customDates : reminder.customDates,
        startAt,
      });

      if (schedule.error) {
        return res.status(400).json({ message: schedule.error });
      }

      reminder.frequency = schedule.frequency;
      reminder.customDates = schedule.customDates;
      reminder.nextCustomDateIndex = schedule.nextCustomDateIndex;
      reminder.nextRunAt = schedule.nextRunAt;
    }

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const toggleReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    reminder.isActive = !reminder.isActive;

    if (
      reminder.isActive &&
      !reminder.nextRunAt &&
      reminder.frequency !== "custom"
    ) {
      reminder.nextRunAt = new Date();
    }

    if (reminder.isActive && reminder.frequency === "custom") {
      const now = new Date();
      const nextIndex = reminder.customDates.findIndex((date) => date >= now);
      if (nextIndex === -1) {
        reminder.isActive = false;
      } else {
        reminder.nextCustomDateIndex = nextIndex;
        reminder.nextRunAt = reminder.customDates[nextIndex];
      }
    }

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    await reminder.deleteOne();
    res.json({ message: "Reminder deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
};

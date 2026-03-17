import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  BellRing,
  Clock3,
  CalendarClock,
  CalendarDays,
  Trash2,
  Power,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

const frequencyOptions = [
  { value: "minute", label: "Every minute" },
  { value: "hour", label: "Every hour" },
  { value: "day", label: "Every day" },
  { value: "month", label: "Every month" },
  { value: "custom", label: "Custom dates" },
];

export default function Reminders() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [frequency, setFrequency] = useState("day");
  const [startAt, setStartAt] = useState("");
  const [customDates, setCustomDates] = useState([""]);

  const fetchReminders = async () => {
    try {
      const res = await api.get("/reminders");
      setReminders(res.data || []);
    } catch (error) {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const activeCount = useMemo(
    () => reminders.filter((reminder) => reminder.isActive).length,
    [reminders],
  );

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setFrequency("day");
    setStartAt("");
    setCustomDates([""]);
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Reminder title is required");
      return;
    }

    const payload = {
      title: title.trim(),
      message: message.trim(),
      frequency,
    };

    if (frequency === "custom") {
      const cleanedCustomDates = customDates
        .map((value) => value.trim())
        .filter(Boolean);

      if (!cleanedCustomDates.length) {
        toast.error("Add at least one custom date");
        return;
      }

      payload.customDates = cleanedCustomDates;
    } else if (startAt) {
      payload.startAt = new Date(startAt).toISOString();
    }

    setSaving(true);
    try {
      await api.post("/reminders", payload);
      toast.success("Reminder created and email alerts enabled");
      resetForm();
      fetchReminders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create reminder");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/reminders/${id}/toggle`);
      setReminders((prev) =>
        prev.map((reminder) => (reminder._id === id ? res.data : reminder)),
      );
      toast.success("Reminder status updated");
    } catch (error) {
      toast.error("Failed to update reminder status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((reminder) => reminder._id !== id));
      toast.success("Reminder deleted");
    } catch (error) {
      toast.error("Failed to delete reminder");
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-white text-3xl font-bold">Reminders</h1>
            <p className="text-white/30 text-sm mt-1">
              {activeCount} active reminders • email notifications enabled
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2">
            <BellRing className="w-4 h-4 text-purple-300" />
            Sends to your registered email
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateReminder}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h2 className="text-white font-semibold text-lg">Create reminder</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reminder title (Rent, Tax, SIP...)"
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 outline-none"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
              {frequencyOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#0f0f1a]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Optional note for email message"
            className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 outline-none resize-none"
          />

          {frequency === "custom" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white/70 text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Pick custom reminder
                  dates
                </p>
                <button
                  type="button"
                  onClick={() => setCustomDates((prev) => [...prev, ""])}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/15 text-white/80 hover:bg-white/10 transition-all">
                  Add another date
                </button>
              </div>

              {customDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) =>
                      setCustomDates((prev) =>
                        prev.map((d, i) => (i === idx ? e.target.value : d)),
                      )
                    }
                    className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                  {customDates.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCustomDates((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="w-10 h-10 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <label className="block">
              <p className="text-white/60 text-xs mb-1.5">
                Start date/time (optional)
              </p>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full md:w-[320px] bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>
          )}

          <div>
            <button
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer">
              {saving ? "Saving..." : "Create reminder"}
            </button>
          </div>
        </motion.form>

        {loading ? (
          <div className="text-white/30 text-center py-20">
            Loading reminders...
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl py-20 text-center text-white/40">
            No reminders yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder, idx) => (
              <motion.div
                key={reminder._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">{reminder.title}</p>
                  <p className="text-white/45 text-xs mt-1">
                    {reminder.message || "No note"}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <span className="px-2.5 py-1 rounded-lg border border-white/10 text-white/75 flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5" /> {reminder.frequency}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg border border-white/10 text-white/75 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Next:{" "}
                      {reminder.nextRunAt
                        ? new Date(reminder.nextRunAt).toLocaleString()
                        : "N/A"}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg border ${
                        reminder.isActive
                          ? "border-emerald-500/40 text-emerald-300"
                          : "border-white/10 text-white/40"
                      }`}>
                      {reminder.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(reminder._id)}
                    className="w-10 h-10 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 transition-all flex items-center justify-center">
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder._id)}
                    className="w-10 h-10 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

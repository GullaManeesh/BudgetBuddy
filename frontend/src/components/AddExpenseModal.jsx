import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function AddExpenseModal({ open, onClose, onSave, budget }) {
  const [form, setForm] = useState({ name: "", amount: "", date: "" });

  useEffect(() => {
    if (open)
      setForm({
        name: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      });
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    onSave({
      budgetId: budget._id,
      name: form.name,
      amount: Number(form.amount),
      date: form.date,
    });
  };

  return (
    <AnimatePresence>
      {open && budget && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl p-7 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-xl font-bold">Add Expense</h2>
                  <p className="text-white/30 text-xs mt-0.5">
                    {budget.icon} {budget.name}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">
                    Expense Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly groceries"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm font-medium transition-all cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all cursor-pointer">
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

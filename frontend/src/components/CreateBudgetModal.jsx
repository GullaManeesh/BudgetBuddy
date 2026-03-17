import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { X } from "lucide-react";

const ACCENT_COLORS = [
  "#a855f7",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

const defaultForm = { name: "", amount: "", icon: "💰", color: "#a855f7" };

export default function CreateBudgetModal({
  open,
  onClose,
  onSave,
  editBudget,
}) {
  const [form, setForm] = useState(defaultForm);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);

  useEffect(() => {
    if (editBudget) {
      setForm({
        name: editBudget.name,
        amount: editBudget.amount,
        icon: editBudget.icon,
        color: editBudget.color,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editBudget, open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    onSave({ ...form, amount: Number(form.amount) });
    setForm(defaultForm);
    setShowEmoji(false);
  };

  return (
    <AnimatePresence>
      {open && (
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
                <h2 className="text-white text-xl font-bold">
                  {editBudget ? "Edit Budget" : "Create Budget"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex gap-3">
                  <div className="relative" ref={emojiRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmoji((v) => !v)}
                      className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-2xl transition-all cursor-pointer">
                      {form.icon}
                    </button>
                    {showEmoji && (
                      <div className="absolute top-16 left-0 z-50">
                        <EmojiPicker
                          theme="dark"
                          onEmojiClick={(e) => {
                            setForm((f) => ({ ...f, icon: e.emoji }));
                            setShowEmoji(false);
                          }}
                          width={300}
                          height={380}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="text-white/40 text-xs mb-1.5 block">
                      Budget Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Groceries"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">
                    Total Budget Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-white/40 text-xs mb-2 block">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="w-8 h-8 rounded-full border-2 transition-all cursor-pointer"
                        style={{
                          backgroundColor: c,
                          borderColor:
                            form.color === c ? "white" : "transparent",
                          transform:
                            form.color === c ? "scale(1.2)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
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
                    {editBudget ? "Save Changes" : "Create Budget"}
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

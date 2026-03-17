import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ellipsis, Pencil, Trash2, Plus } from "lucide-react";

export default function BudgetCard({
  budget,
  onEdit,
  onDelete,
  onAddExpense,
  onView,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const spent = budget.spent || 0;
  const total = budget.amount || 1;
  const percent = Math.min((spent / total) * 100, 100);
  const remaining = Math.max(total - spent, 0);

  const barColor =
    percent >= 90 ? "#ef4444" : percent >= 60 ? "#f59e0b" : "#a855f7";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={() => onView?.(budget)}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-500/30 transition-all duration-200 relative cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{
              backgroundColor: `${budget.color}22`,
              border: `1px solid ${budget.color}44`,
            }}>
            {budget.icon}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">
              {budget.name}
            </h3>
            <p className="text-white/40 text-xs mt-0.5">Budget</p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <Ellipsis className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-9 bg-[#16161f] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20 min-w-[130px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(budget);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(budget._id);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <p className="text-white/30 text-xs mb-0.5">Total Budget</p>
          <p className="text-white font-semibold">${total.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-xs mb-0.5">Remaining</p>
          <p
            className="font-semibold"
            style={{ color: remaining === 0 ? "#ef4444" : "#a3e635" }}>
            ${remaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-white/30 mb-1.5">
          <span>${spent.toLocaleString()} spent</span>
          <span>{Math.round(percent)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
          />
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddExpense(budget);
        }}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-purple-300 border border-purple-500/30 hover:bg-purple-500/15 hover:border-purple-400/50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add Expense
      </button>
    </motion.div>
  );
}

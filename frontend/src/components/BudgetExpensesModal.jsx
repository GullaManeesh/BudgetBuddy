import { AnimatePresence, motion } from "framer-motion";
import { X, Pencil, Trash2, ReceiptText, Plus } from "lucide-react";

export default function BudgetExpensesModal({
  open,
  budget,
  expenses,
  loading,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}) {
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
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-3xl max-h-[88vh] overflow-auto bg-[#0f0f1a] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="min-w-0">
                  <h2 className="text-white text-xl font-bold truncate">
                    {budget.icon} {budget.name} Expenses
                  </h2>
                  <p className="text-white/35 text-sm mt-1">
                    {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg text-white/45 hover:text-white hover:bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4 flex justify-end">
                <button
                  onClick={onAdd}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>

              {loading ? (
                <div className="text-white/35 text-center py-16">
                  Loading expenses...
                </div>
              ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <ReceiptText className="w-7 h-7 text-purple-300" />
                  </div>
                  <p className="text-white/35">
                    No expenses in this budget yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {expense.name}
                        </p>
                        <p className="text-white/35 text-xs">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-red-400 font-semibold">
                          -${Number(expense.amount).toLocaleString()}
                        </p>
                        <button
                          onClick={() => onEdit(expense)}
                          className="w-9 h-9 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(expense._id)}
                          className="w-9 h-9 rounded-lg border border-red-500/25 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

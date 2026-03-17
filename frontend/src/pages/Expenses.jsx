import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  CalendarRange,
  BadgeDollarSign,
  Pencil,
  Trash2,
  ReceiptText,
  SlidersHorizontal,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ExpenseFormModal from "../components/ExpenseFormModal";
import api from "../api/axios";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    budgetId: "",
    minAmount: "",
    maxAmount: "",
    fromDate: "",
    toDate: "",
  });

  const fetchData = async () => {
    try {
      const [expenseRes, budgetRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/budgets"),
      ]);
      setExpenses(expenseRes.data);
      setBudgets(budgetRes.data);
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const searchText = filters.search.trim().toLowerCase();
      const expenseDate = expense.date ? expense.date.split("T")[0] : "";

      if (searchText && !expense.name.toLowerCase().includes(searchText)) {
        return false;
      }

      if (filters.budgetId && expense.budget?._id !== filters.budgetId) {
        return false;
      }

      if (filters.minAmount && expense.amount < Number(filters.minAmount)) {
        return false;
      }

      if (filters.maxAmount && expense.amount > Number(filters.maxAmount)) {
        return false;
      }

      if (filters.fromDate && expenseDate < filters.fromDate) {
        return false;
      }

      if (filters.toDate && expenseDate > filters.toDate) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  const handleSaveExpense = async (payload) => {
    try {
      if (editExpense) {
        await api.put(`/expenses/${editExpense._id}`, payload);
        toast.success("Expense updated successfully");
      } else {
        await api.post("/expenses", payload);
        toast.success("Expense created successfully");
      }

      setModalOpen(false);
      setEditExpense(null);
      fetchData();
      window.dispatchEvent(new Event("expenses-updated"));
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      window.dispatchEvent(new Event("expenses-updated"));
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-white text-3xl font-bold">Expenses</h1>
            <p className="text-white/30 text-sm mt-1">
              {filteredExpenses.length} shown • $
              {totalFiltered.toLocaleString()} total
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setEditExpense(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-purple-900/40">
            <Plus className="w-4 h-4" /> Add Expense
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-white/70 text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <label className="relative xl:col-span-2">
              <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search by expense name"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/25 outline-none"
              />
            </label>

            <select
              value={filters.budgetId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, budgetId: e.target.value }))
              }
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
              <option value="" className="bg-[#0f0f1a]">
                All budgets
              </option>
              {budgets.map((b) => (
                <option key={b._id} value={b._id} className="bg-[#0f0f1a]">
                  {b.icon} {b.name}
                </option>
              ))}
            </select>

            <label className="relative">
              <BadgeDollarSign className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                value={filters.minAmount}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minAmount: e.target.value }))
                }
                placeholder="Min amount"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/25 outline-none"
              />
            </label>

            <label className="relative">
              <BadgeDollarSign className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                value={filters.maxAmount}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))
                }
                placeholder="Max amount"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/25 outline-none"
              />
            </label>

            <label className="relative">
              <CalendarRange className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm outline-none"
              />
            </label>

            <label className="relative xl:col-span-1">
              <CalendarRange className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm outline-none"
              />
            </label>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-white/30 text-center py-20">
            Loading expenses…
          </div>
        ) : filteredExpenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ReceiptText className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              No expenses found
            </h3>
            <p className="text-white/30 text-sm">
              Try changing filters or add a new expense
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((e) => (
              <motion.div
                key={e._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{
                      backgroundColor: `${e.budget?.color || "#a855f7"}22`,
                      border: `1px solid ${e.budget?.color || "#a855f7"}44`,
                    }}>
                    {e.budget?.icon || "💰"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {e.name}
                    </p>
                    <p className="text-white/35 text-xs truncate">
                      {e.budget?.name || "Unknown budget"} •{" "}
                      {new Date(e.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-red-400 font-semibold">
                    -${e.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      setEditExpense(e);
                      setModalOpen(true);
                    }}
                    className="w-9 h-9 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(e._id)}
                    className="w-9 h-9 rounded-lg border border-red-500/25 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditExpense(null);
        }}
        onSave={handleSaveExpense}
        budgets={budgets}
        editExpense={editExpense}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import BudgetCard from "../components/BudgetCard";
import CreateBudgetModal from "../components/CreateBudgetModal";
import AddExpenseModal from "../components/AddExpenseModal";
import ExpenseFormModal from "../components/ExpenseFormModal";
import BudgetExpensesModal from "../components/BudgetExpensesModal";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Plus,
  BriefcaseBusiness,
  Search,
  BadgeDollarSign,
  CalendarRange,
  SlidersHorizontal,
} from "lucide-react";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [expenseBudget, setExpenseBudget] = useState(null);
  const [viewBudget, setViewBudget] = useState(null);
  const [budgetExpenses, setBudgetExpenses] = useState([]);
  const [budgetExpensesLoading, setBudgetExpensesLoading] = useState(false);
  const [expenseEditorOpen, setExpenseEditorOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    minAmount: "",
    maxAmount: "",
    fromDate: "",
    toDate: "",
  });

  const fetchBudgets = async () => {
    try {
      const res = await api.get("/budgets");
      setBudgets(res.data);
      if (viewBudget?._id) {
        const refreshed = res.data.find((b) => b._id === viewBudget._id);
        if (refreshed) setViewBudget(refreshed);
      }
    } catch (error) {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetExpenses = async (budgetId) => {
    if (!budgetId) return;
    setBudgetExpensesLoading(true);
    try {
      const res = await api.get(`/expenses?budgetId=${budgetId}`);
      setBudgetExpenses(res.data);
    } catch (error) {
      toast.error("Failed to load budget expenses");
    } finally {
      setBudgetExpensesLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    const syncBudgets = () => {
      fetchBudgets();
      if (viewBudget?._id) fetchBudgetExpenses(viewBudget._id);
    };

    window.addEventListener("expenses-updated", syncBudgets);
    return () => window.removeEventListener("expenses-updated", syncBudgets);
  }, [viewBudget?._id]);

  const handleSaveBudget = async (data) => {
    try {
      if (editBudget) {
        const res = await api.put(`/budgets/${editBudget._id}`, data);
        setBudgets((prev) =>
          prev.map((b) => (b._id === editBudget._id ? res.data : b)),
        );
        setEditBudget(null);
        toast.success("Budget updated successfully");
      } else {
        const res = await api.post("/budgets", data);
        setBudgets((prev) => [res.data, ...prev]);
        setCreateOpen(false);
        toast.success("Budget created successfully");
      }
    } catch (error) {
      toast.error("Failed to save budget");
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
      toast.success("Budget deleted");
    } catch (error) {
      toast.error("Failed to delete budget");
    }
  };

  const handleAddExpense = async (data) => {
    try {
      await api.post("/expenses", data);
      setExpenseBudget(null);
      fetchBudgets(); // Refresh spent amounts
      if (viewBudget?._id === data.budgetId) {
        fetchBudgetExpenses(viewBudget._id);
      }
      window.dispatchEvent(new Event("expenses-updated"));
      toast.success("Expense added successfully");
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  const openBudgetDetails = (budget) => {
    setViewBudget(budget);
    fetchBudgetExpenses(budget._id);
  };

  const handleOpenExpenseEditor = (expense = null) => {
    setEditExpense(expense);
    setExpenseEditorOpen(true);
  };

  const handleSaveExpenseFromBudget = async (data) => {
    try {
      if (editExpense) {
        await api.put(`/expenses/${editExpense._id}`, data);
        toast.success("Expense updated successfully");
      } else {
        await api.post("/expenses", data);
        toast.success("Expense added successfully");
      }

      setExpenseEditorOpen(false);
      setEditExpense(null);
      if (viewBudget?._id) {
        fetchBudgetExpenses(viewBudget._id);
      }
      fetchBudgets();
      window.dispatchEvent(new Event("expenses-updated"));
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const handleDeleteExpenseFromBudget = async (expenseId) => {
    try {
      await api.delete(`/expenses/${expenseId}`);
      setBudgetExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      fetchBudgets();
      window.dispatchEvent(new Event("expenses-updated"));
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const query = filters.search.trim().toLowerCase();
      const createdDate = budget.createdAt
        ? budget.createdAt.split("T")[0]
        : "";

      if (query && !budget.name.toLowerCase().includes(query)) {
        return false;
      }

      if (filters.minAmount && budget.amount < Number(filters.minAmount)) {
        return false;
      }

      if (filters.maxAmount && budget.amount > Number(filters.maxAmount)) {
        return false;
      }

      if (filters.fromDate && createdDate < filters.fromDate) {
        return false;
      }

      if (filters.toDate && createdDate > filters.toDate) {
        return false;
      }

      return true;
    });
  }, [budgets, filters]);

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold">Budgets</h1>
            <p className="text-white/30 text-sm mt-1">
              {filteredBudgets.length} shown • {budgets.length} total budgets
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-purple-900/40">
            <Plus className="w-4 h-4" /> Create Budget
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-white/70 text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <label className="relative xl:col-span-2">
              <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search by budget name"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/25 outline-none"
              />
            </label>

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

            <label className="relative">
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
            Loading budgets…
          </div>
        ) : budgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BriefcaseBusiness className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              No budgets yet
            </h3>
            <p className="text-white/30 text-sm mb-6">
              Create your first budget to start tracking expenses
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all cursor-pointer">
              Create Budget
            </button>
          </motion.div>
        ) : filteredBudgets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BriefcaseBusiness className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              No matching budgets
            </h3>
            <p className="text-white/30 text-sm">
              Try changing your filter values
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredBudgets.map((budget) => (
                <BudgetCard
                  key={budget._id}
                  budget={budget}
                  onEdit={(b) => setEditBudget(b)}
                  onDelete={handleDeleteBudget}
                  onAddExpense={(b) => setExpenseBudget(b)}
                  onView={openBudgetDetails}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <CreateBudgetModal
        open={createOpen || !!editBudget}
        onClose={() => {
          setCreateOpen(false);
          setEditBudget(null);
        }}
        onSave={handleSaveBudget}
        editBudget={editBudget}
      />

      <AddExpenseModal
        open={!!expenseBudget}
        onClose={() => setExpenseBudget(null)}
        onSave={handleAddExpense}
        budget={expenseBudget}
      />

      <BudgetExpensesModal
        open={!!viewBudget}
        budget={viewBudget}
        expenses={budgetExpenses}
        loading={budgetExpensesLoading}
        onClose={() => {
          setViewBudget(null);
          setBudgetExpenses([]);
        }}
        onAdd={() => handleOpenExpenseEditor(null)}
        onEdit={(expense) => handleOpenExpenseEditor(expense)}
        onDelete={handleDeleteExpenseFromBudget}
      />

      <ExpenseFormModal
        open={expenseEditorOpen}
        onClose={() => {
          setExpenseEditorOpen(false);
          setEditExpense(null);
        }}
        onSave={handleSaveExpenseFromBudget}
        budgets={viewBudget ? [viewBudget] : budgets}
        editExpense={editExpense}
      />
    </div>
  );
}

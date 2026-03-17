import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  BriefcaseBusiness,
  TrendingDown,
  PiggyBank,
  FolderKanban,
  Hand,
} from "lucide-react";

const COLORS = [
  "#a855f7",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#16161f] border border-white/10 rounded-xl px-4 py-2 text-sm text-white shadow-xl">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-purple-300">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/budgets"), api.get("/expenses")])
      .then(([b, e]) => {
        setBudgets(b.data);
        setExpenses(e.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  const pieData = budgets
    .filter((b) => (b.spent || 0) > 0)
    .map((b) => ({ name: `${b.icon} ${b.name}`, value: b.spent }));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = d.toISOString().split("T")[0];
    const total = expenses
      .filter((e) => e.date?.split("T")[0] === dateStr)
      .reduce((s, e) => s + e.amount, 0);
    return { day: label, spent: total };
  });

  const stats = [
    {
      label: "Total Budget",
      value: `$${totalBudget.toLocaleString()}`,
      icon: BriefcaseBusiness,
      color: "#a855f7",
    },
    {
      label: "Total Spent",
      value: `$${totalSpent.toLocaleString()}`,
      icon: TrendingDown,
      color: "#6366f1",
    },
    {
      label: "Remaining",
      value: `$${totalRemaining.toLocaleString()}`,
      icon: PiggyBank,
      color: "#10b981",
    },
    {
      label: "Budgets",
      value: budgets.length,
      icon: FolderKanban,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-white text-3xl font-bold">
              Good {getGreeting()}, {user?.name?.split(" ")[0]}
            </h1>
            <Hand className="w-6 h-6 text-purple-300" />
          </div>
          <p className="text-white/30 text-sm mt-1">
            Here's your financial overview
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-purple-500/20 transition-all">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ backgroundColor: `${s.color}22` }}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-white text-2xl font-bold">{s.value}</p>
              <p className="text-white/30 text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="text-white/30 text-center py-20">Loading charts…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-5">
                Spending by Budget
              </h2>
              {pieData.length === 0 ? (
                <div className="text-white/20 text-center py-14">
                  No expenses yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(v) => (
                        <span className="text-white/60 text-xs">{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-5">
                Daily Spending (Last 7 Days)
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={last7} barSize={28}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="spent"
                    fill="#a855f7"
                    radius={[6, 6, 0, 0]}
                    name="Spent"
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-white font-semibold mb-4">Recent Expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-8">
                  No expenses recorded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 8).map((e) => (
                    <div
                      key={e._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5 px-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {e.budget?.icon || "💰"}
                        </span>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {e.name}
                          </p>
                          <p className="text-white/30 text-xs">
                            {e.budget?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 text-sm font-semibold">
                          -${e.amount.toLocaleString()}
                        </p>
                        <p className="text-white/20 text-xs">
                          {new Date(e.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

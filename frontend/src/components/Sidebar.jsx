import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ReceiptText,
  UsersRound,
  BellRing,
  LogOut,
  WalletCards,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/budgets", label: "Budgets", icon: BriefcaseBusiness },
  { to: "/expenses", label: "Expenses", icon: ReceiptText },
  { to: "/group-split", label: "Group Split", icon: UsersRound },
  { to: "/reminders", label: "Reminders", icon: BellRing },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileSidebar = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-11 h-11 rounded-xl border border-white/15 bg-[#111328] text-white flex items-center justify-center shadow-lg shadow-black/30"
        aria-label="Open sidebar menu">
        <Menu className="w-5 h-5" />
      </button>

      {isOpen ? (
        <button
          onClick={closeMobileSidebar}
          aria-label="Close sidebar overlay"
          className="md:hidden fixed inset-0 bg-black/55 z-30"
        />
      ) : null}

      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed left-0 top-0 h-full w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex items-center justify-between gap-3 px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-lg">
              <WalletCards className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">
              BudgetBuddy
            </span>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="md:hidden w-8 h-8 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 flex items-center justify-center"
            aria-label="Close sidebar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`
              }>
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name}
              </p>
              <p className="text-white/30 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 cursor-pointer">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}

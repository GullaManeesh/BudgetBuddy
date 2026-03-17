import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  UserPlus,
  WalletCards,
  ArrowRightLeft,
  ReceiptText,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import GroupExpenseModal from "../components/GroupExpenseModal";

export default function GroupSplit() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const [groupName, setGroupName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editGroupForm, setEditGroupForm] = useState({
    name: "",
    icon: "👥",
    color: "#6366f1",
  });

  const selectedGroup = useMemo(
    () => groups.find((g) => g._id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );
  const selectedGroupColor = selectedGroup?.color || "#a855f7";

  const loadGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
      if (!selectedGroupId && res.data.length) {
        setSelectedGroupId(res.data[0]._id);
      }
    } catch (error) {
      toast.error("Failed to load groups");
    }
  };

  const loadGroupDetails = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroupDetails(res.data);
    } catch (error) {
      toast.error("Failed to load group details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedGroupId) loadGroupDetails(selectedGroupId);
  }, [selectedGroupId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const res = await api.post("/groups", { name: groupName.trim() });
      setGroups((prev) => [res.data, ...prev]);
      setSelectedGroupId(res.data._id);
      setGroupName("");
      toast.success("Group created");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !memberEmail.trim()) return;

    try {
      const res = await api.post(`/groups/${selectedGroupId}/members`, {
        email: memberEmail.trim(),
      });
      const updatedGroup = res.data?.group || res.data;
      setGroups((prev) =>
        prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
      );
      setGroupDetails((prev) => ({ ...prev, group: updatedGroup }));
      setMemberEmail("");
      toast.success(res.data?.message || "Member added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const openEditGroupModal = () => {
    if (!selectedGroup) return;

    setEditGroupForm({
      name: selectedGroup.name || "",
      icon: selectedGroup.icon || "👥",
      color: selectedGroup.color || "#6366f1",
    });
    setEditGroupModalOpen(true);
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedGroup) return;

    if (!editGroupForm.name.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    try {
      const res = await api.put(`/groups/${selectedGroupId}`, {
        name: editGroupForm.name.trim(),
        icon: editGroupForm.icon || "👥",
        color: editGroupForm.color || "#6366f1",
      });

      setGroups((prev) =>
        prev.map((group) => (group._id === selectedGroupId ? res.data : group)),
      );

      setGroupDetails((prev) => {
        if (!prev) return prev;
        return { ...prev, group: res.data };
      });

      setEditGroupModalOpen(false);

      toast.success("Group updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId || !selectedGroup) return;

    const confirmed = window.confirm(
      `Delete group \"${selectedGroup.name}\" and all its split expenses?`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/groups/${selectedGroupId}`);

      setGroups((prev) =>
        prev.filter((group) => group._id !== selectedGroupId),
      );
      setGroupDetails(null);

      const remaining = groups.filter((group) => group._id !== selectedGroupId);
      setSelectedGroupId(remaining[0]?._id || "");

      toast.success("Group deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    }
  };

  const handleSaveExpense = async (payload) => {
    if (!selectedGroupId) return;

    try {
      if (editingExpense) {
        await api.put(
          `/groups/${selectedGroupId}/expenses/${editingExpense._id}`,
          payload,
        );
        toast.success("Split expense updated");
      } else {
        await api.post(`/groups/${selectedGroupId}/expenses`, payload);
        toast.success("Split expense created");
      }
      setExpenseModalOpen(false);
      setEditingExpense(null);
      loadGroupDetails(selectedGroupId);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to save split expense",
      );
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!selectedGroupId) return;

    try {
      await api.delete(`/groups/${selectedGroupId}/expenses/${expenseId}`);
      toast.success("Split expense deleted");
      loadGroupDetails(selectedGroupId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete expense");
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 overflow-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <section className="xl:col-span-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-white font-semibold">
                <Users className="w-4 h-4 text-purple-300" /> Groups
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-2 mb-3">
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="New group name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                />
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium cursor-pointer">
                  <Plus className="w-4 h-4" /> Create Group
                </button>
              </form>

              <div className="space-y-2 max-h-[280px] overflow-auto">
                {groups.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => setSelectedGroupId(g._id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                      selectedGroupId === g._id
                        ? "text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                    }`}
                    style={
                      selectedGroupId === g._id
                        ? {
                            borderColor: `${g.color || "#a855f7"}88`,
                            backgroundColor: `${g.color || "#a855f7"}22`,
                          }
                        : undefined
                    }>
                    <p className="text-sm font-medium truncate">
                      {(g.icon || "👥") + " " + g.name}
                    </p>
                    <p className="text-xs opacity-70">
                      {g.members.length} members
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>

            {selectedGroup && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 text-white font-semibold">
                  <UserPlus className="w-4 h-4 text-purple-300" /> Add Member
                </div>
                <form onSubmit={handleAddMember} className="space-y-2">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="friend@gmail.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                  <button className="w-full py-2.5 rounded-xl border border-purple-500/30 text-purple-200 hover:bg-purple-500/15 text-sm cursor-pointer">
                    Invite/Add Member
                  </button>
                </form>
              </motion.div>
            )}
          </section>

          <section className="xl:col-span-3 space-y-5">
            {loading ? (
              <div className="text-white/40 text-center py-20">
                Loading group split data…
              </div>
            ) : !selectedGroup ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40">
                Create or select a group to start split expenses.
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-white text-3xl font-bold flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedGroupColor }}
                        />
                        {(selectedGroup.icon || "👥") +
                          " " +
                          selectedGroup.name}
                      </h1>
                      <p className="text-white/30 text-sm mt-1">
                        {(groupDetails?.group?.members || []).length} members •{" "}
                        {(groupDetails?.expenses || []).length} split expenses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openEditGroupModal}
                        className="w-10 h-10 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
                        title="Edit group name">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeleteGroup}
                        className="w-10 h-10 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center cursor-pointer"
                        title="Delete group">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingExpense(null);
                          setExpenseModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer"
                        style={{
                          backgroundColor: selectedGroupColor,
                          boxShadow: `0 10px 24px ${selectedGroupColor}55`,
                        }}>
                        <Plus className="w-4 h-4" /> Add Split Expense
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-white font-semibold mb-3">
                      <WalletCards className="w-4 h-4 text-purple-300" />{" "}
                      Balances
                    </div>
                    <div className="space-y-2">
                      {(groupDetails?.balances || []).length === 0 ? (
                        <p className="text-white/30 text-sm">No balances yet</p>
                      ) : (
                        groupDetails.balances.map((b) => (
                          <div
                            key={b.user._id}
                            className="flex justify-between text-sm bg-white/5 rounded-xl px-3 py-2">
                            <span className="text-white/80">{b.user.name}</span>
                            <span
                              className={
                                b.net >= 0 ? "text-green-400" : "text-red-400"
                              }>
                              {b.net >= 0 ? "+" : ""}$
                              {Math.abs(b.net).toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-white font-semibold mb-3">
                      <ArrowRightLeft className="w-4 h-4 text-purple-300" />{" "}
                      Suggested Settlements
                    </div>
                    <div className="space-y-2">
                      {(groupDetails?.settlements || []).length === 0 ? (
                        <p className="text-white/30 text-sm">All settled up</p>
                      ) : (
                        groupDetails.settlements.map((s, idx) => (
                          <div
                            key={`${s.from._id}-${s.to._id}-${idx}`}
                            className="text-sm bg-white/5 rounded-xl px-3 py-2 text-white/80">
                            <span className="text-red-300">{s.from.name}</span>{" "}
                            pays{" "}
                            <span className="text-green-300">{s.to.name}</span>{" "}
                            <span className="text-purple-300">
                              ${Number(s.amount).toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-white font-semibold mb-3">
                    <ReceiptText className="w-4 h-4 text-purple-300" /> Split
                    Expenses
                  </div>
                  {(groupDetails?.expenses || []).length === 0 ? (
                    <p className="text-white/30 text-sm">
                      No split expenses yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {groupDetails.expenses.map((e) => (
                        <div
                          key={e._id}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-white font-medium">
                              {(e.icon || "💸") + " " + e.description}
                            </p>
                            <p className="text-white/35 text-xs">
                              Paid by {e.paidBy?.name} •{" "}
                              {new Date(e.date).toLocaleDateString()} •{" "}
                              {e.splitType}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-purple-300 font-semibold">
                              ${Number(e.totalAmount).toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingExpense(e);
                                setExpenseModalOpen(true);
                              }}
                              className="w-9 h-9 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(e._id)}
                              className="w-9 h-9 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </section>
        </div>
      </main>

      <GroupExpenseModal
        open={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        members={groupDetails?.group?.members || []}
        editExpense={editingExpense}
        onSave={handleSaveExpense}
      />

      {editGroupModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            onClick={() => setEditGroupModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close edit group modal"
          />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f0f1a] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Edit Group</h3>
                <button
                  onClick={() => setEditGroupModalOpen(false)}
                  className="w-8 h-8 rounded-lg border border-white/10 text-white/70 hover:bg-white/10 flex items-center justify-center cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditGroup} className="space-y-3">
                <input
                  value={editGroupForm.name}
                  onChange={(e) =>
                    setEditGroupForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Group name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={editGroupForm.icon}
                    onChange={(e) =>
                      setEditGroupForm((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    }
                    placeholder="Icon"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                  <input
                    type="color"
                    value={editGroupForm.color}
                    onChange={(e) =>
                      setEditGroupForm((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-2 py-2 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditGroupModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold cursor-pointer">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

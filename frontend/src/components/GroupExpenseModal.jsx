import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const splitTypes = [
  { value: "equal", label: "Equal" },
  { value: "exact", label: "Exact" },
  { value: "percentage", label: "Percentage" },
  { value: "shares", label: "Shares" },
];

export default function GroupExpenseModal({
  open,
  onClose,
  members,
  onSave,
  editExpense,
}) {
  const [form, setForm] = useState({
    icon: "💸",
    description: "",
    totalAmount: "",
    paidBy: "",
    date: new Date().toISOString().split("T")[0],
    splitType: "equal",
  });
  const [participantIds, setParticipantIds] = useState([]);
  const [splitInputs, setSplitInputs] = useState({});

  useEffect(() => {
    if (!open) return;

    if (editExpense) {
      const participants = editExpense.participants?.map((p) => p._id) || [];
      const preparedInputs = {};
      (editExpense.splits || []).forEach((s) => {
        preparedInputs[s.user._id] = {
          amount: s.amount,
          percentage: s.percentage ?? "",
          shares: s.shares ?? "",
        };
      });

      setForm({
        icon: editExpense.icon || "💸",
        description: editExpense.description || "",
        totalAmount: editExpense.totalAmount || "",
        paidBy: editExpense.paidBy?._id || "",
        date: editExpense.date
          ? new Date(editExpense.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        splitType: editExpense.splitType || "equal",
      });
      setParticipantIds(participants);
      setSplitInputs(preparedInputs);
      return;
    }

    const defaultIds = members.map((m) => m.user._id);
    setForm({
      icon: "💸",
      description: "",
      totalAmount: "",
      paidBy: defaultIds[0] || "",
      date: new Date().toISOString().split("T")[0],
      splitType: "equal",
    });
    setParticipantIds(defaultIds);
    setSplitInputs({});
  }, [open, editExpense, members]);

  const total = Number(form.totalAmount || 0);

  const computedSplits = useMemo(() => {
    if (!participantIds.length || !total) return [];

    if (form.splitType === "equal") {
      const each = total / participantIds.length;
      return participantIds.map((id, idx) => ({
        user: id,
        amount:
          idx === participantIds.length - 1
            ? Number((total - each * (participantIds.length - 1)).toFixed(2))
            : Number(each.toFixed(2)),
      }));
    }

    if (form.splitType === "exact") {
      return participantIds.map((id) => ({
        user: id,
        amount: Number(splitInputs[id]?.amount || 0),
      }));
    }

    if (form.splitType === "percentage") {
      return participantIds.map((id) => ({
        user: id,
        percentage: Number(splitInputs[id]?.percentage || 0),
        amount: Number(
          ((total * Number(splitInputs[id]?.percentage || 0)) / 100).toFixed(2),
        ),
      }));
    }

    return participantIds.map((id) => ({
      user: id,
      shares: Number(splitInputs[id]?.shares || 0),
      amount: 0,
    }));
  }, [participantIds, total, form.splitType, splitInputs]);

  const shareAdjustedSplits = useMemo(() => {
    if (form.splitType !== "shares") return computedSplits;

    const totalShares = computedSplits.reduce(
      (s, i) => s + Number(i.shares || 0),
      0,
    );
    if (!totalShares) return computedSplits;

    return computedSplits.map((item, idx) => {
      const amount = (total * Number(item.shares || 0)) / totalShares;
      return {
        ...item,
        amount:
          idx === computedSplits.length - 1
            ? Number(
                (
                  total -
                  computedSplits
                    .slice(0, -1)
                    .reduce(
                      (a, p) =>
                        a +
                        Number(
                          (
                            (total * Number(p.shares || 0)) /
                            totalShares
                          ).toFixed(2),
                        ),
                      0,
                    )
                ).toFixed(2),
              )
            : Number(amount.toFixed(2)),
      };
    });
  }, [computedSplits, form.splitType, total]);

  const totalSplit = shareAdjustedSplits.reduce(
    (s, i) => s + Number(i.amount || 0),
    0,
  );

  const toggleParticipant = (id) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const setSplitField = (id, key, value) => {
    setSplitInputs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const canSubmit =
    form.description.trim() &&
    total > 0 &&
    form.paidBy &&
    participantIds.length > 0 &&
    Math.abs(totalSplit - total) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSave({
      icon: form.icon || "💸",
      description: form.description.trim(),
      totalAmount: total,
      paidBy: form.paidBy,
      date: form.date,
      splitType: form.splitType,
      participants: participantIds,
      splits: shareAdjustedSplits,
    });
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
            <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl p-7 w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold">
                  {editExpense ? "Edit Split Expense" : "Add Split Expense"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    placeholder="Icon (emoji)"
                    value={form.icon}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    }
                    className="bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  />
                  <input
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Total Amount"
                    value={form.totalAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        totalAmount: e.target.value,
                      }))
                    }
                    className="bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  />
                  <select
                    value={form.paidBy}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, paidBy: e.target.value }))
                    }
                    className="bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none">
                    {members.map((m) => (
                      <option
                        key={m.user._id}
                        value={m.user._id}
                        className="bg-[#0f0f1a]">
                        Paid by: {m.user.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="bg-white/5 border border-white/10 focus:border-purple-500/60 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {splitTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, splitType: type.value }))
                      }
                      className={`py-2.5 rounded-xl text-sm border transition-all ${
                        form.splitType === type.value
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                          : "border-white/10 text-white/60 hover:text-white"
                      }`}>
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-white/80 text-sm font-medium mb-3">
                    Participants
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {members.map((m) => {
                      const checked = participantIds.includes(m.user._id);
                      return (
                        <label
                          key={m.user._id}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-white text-sm">
                            {m.user.name}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleParticipant(m.user._id)}
                            className="accent-purple-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {form.splitType !== "equal" && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-white/80 text-sm font-medium mb-3">
                      Split Details
                    </p>
                    <div className="space-y-2">
                      {participantIds.map((id) => {
                        const member = members.find((m) => m.user._id === id);
                        if (!member) return null;

                        return (
                          <div
                            key={id}
                            className="grid grid-cols-12 items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                            <span className="col-span-5 text-white text-sm truncate">
                              {member.user.name}
                            </span>
                            {form.splitType === "exact" && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={splitInputs[id]?.amount ?? ""}
                                onChange={(e) =>
                                  setSplitField(id, "amount", e.target.value)
                                }
                                placeholder="Amount"
                                className="col-span-7 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                              />
                            )}
                            {form.splitType === "percentage" && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={splitInputs[id]?.percentage ?? ""}
                                onChange={(e) =>
                                  setSplitField(
                                    id,
                                    "percentage",
                                    e.target.value,
                                  )
                                }
                                placeholder="%"
                                className="col-span-7 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                              />
                            )}
                            {form.splitType === "shares" && (
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={splitInputs[id]?.shares ?? ""}
                                onChange={(e) =>
                                  setSplitField(id, "shares", e.target.value)
                                }
                                placeholder="Shares"
                                className="col-span-7 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-white/80 text-sm font-medium mb-2">
                    Preview
                  </p>
                  <div className="space-y-1.5">
                    {shareAdjustedSplits.map((split) => {
                      const member = members.find(
                        (m) => m.user._id === split.user,
                      );
                      if (!member) return null;
                      return (
                        <div
                          key={split.user}
                          className="flex justify-between text-sm">
                          <span className="text-white/70">
                            {member.user.name}
                          </span>
                          <span className="text-purple-300">
                            ${Number(split.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-white/60">Split Total</span>
                    <span
                      className={
                        Math.abs(totalSplit - total) < 0.01
                          ? "text-green-400"
                          : "text-red-400"
                      }>
                      ${Number(totalSplit || 0).toFixed(2)} / $
                      {Number(total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold disabled:opacity-50">
                    {editExpense ? "Save Expense" : "Create Expense"}
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

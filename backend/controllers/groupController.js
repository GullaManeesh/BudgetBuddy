const mongoose = require("mongoose");
const Group = require("../models/Group");
const GroupExpense = require("../models/GroupExpense");
const User = require("../models/User");
const {
  sendGroupInviteEmail,
  isMailerConfigured,
} = require("../services/emailService");

const EPSILON = 0.01;

const round2 = (v) => Math.round(v * 100) / 100;
const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const memberUserId = (member) => String(member.user?._id || member.user);

const isMember = (group, userId) =>
  group.members.some((m) => memberUserId(m) === userId.toString());

const getGroupForUser = async (groupId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
  const group = await Group.findById(groupId).populate(
    "members.user",
    "name email avatar",
  );
  if (!group) return null;
  if (!isMember(group, userId)) return null;
  return group;
};

const buildSplits = ({ splitType, participants, totalAmount, splitsInput }) => {
  const participantIds = participants.map((id) => id.toString());
  const uniqueIds = [...new Set(participantIds)];

  if (uniqueIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  if (splitType === "equal") {
    const perHead = totalAmount / uniqueIds.length;
    return uniqueIds.map((userId, idx) => {
      const amount =
        idx === uniqueIds.length - 1
          ? round2(totalAmount - perHead * (uniqueIds.length - 1))
          : round2(perHead);
      return { user: userId, amount };
    });
  }

  if (!Array.isArray(splitsInput) || splitsInput.length === 0) {
    throw new Error("Split details are required");
  }

  const prepared = splitsInput
    .filter((s) => uniqueIds.includes(String(s.user)))
    .map((s) => ({
      user: String(s.user),
      amount: Number(s.amount || 0),
      percentage: s.percentage !== undefined ? Number(s.percentage) : undefined,
      shares: s.shares !== undefined ? Number(s.shares) : undefined,
    }));

  if (splitType === "exact") {
    const total = prepared.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(total - totalAmount) > EPSILON) {
      throw new Error("Exact split amounts must equal total amount");
    }
    return prepared.map((s) => ({ user: s.user, amount: round2(s.amount) }));
  }

  if (splitType === "percentage") {
    const pctTotal = prepared.reduce(
      (sum, s) => sum + Number(s.percentage || 0),
      0,
    );
    if (Math.abs(pctTotal - 100) > EPSILON) {
      throw new Error("Percentage split must add up to 100%");
    }
    return prepared.map((s, idx) => {
      const computed = (totalAmount * Number(s.percentage || 0)) / 100;
      const amount =
        idx === prepared.length - 1
          ? round2(
              totalAmount -
                prepared
                  .slice(0, -1)
                  .reduce(
                    (a, p) =>
                      a +
                      round2((totalAmount * Number(p.percentage || 0)) / 100),
                    0,
                  ),
            )
          : round2(computed);
      return { user: s.user, amount, percentage: Number(s.percentage || 0) };
    });
  }

  if (splitType === "shares") {
    const totalShares = prepared.reduce(
      (sum, s) => sum + Number(s.shares || 0),
      0,
    );
    if (totalShares <= 0)
      throw new Error("Total shares must be greater than 0");

    return prepared.map((s, idx) => {
      const computed = (totalAmount * Number(s.shares || 0)) / totalShares;
      const amount =
        idx === prepared.length - 1
          ? round2(
              totalAmount -
                prepared
                  .slice(0, -1)
                  .reduce(
                    (a, p) =>
                      a +
                      round2(
                        (totalAmount * Number(p.shares || 0)) / totalShares,
                      ),
                    0,
                  ),
            )
          : round2(computed);
      return { user: s.user, amount, shares: Number(s.shares || 0) };
    });
  }

  throw new Error("Invalid split type");
};

const buildBalances = async (groupId) => {
  const expenses = await GroupExpense.find({ group: groupId })
    .populate("paidBy", "name email")
    .populate("splits.user", "name email")
    .sort({ date: -1 });

  const balanceMap = new Map();

  expenses.forEach((expense) => {
    const payerId = String(expense.paidBy._id);
    if (!balanceMap.has(payerId)) {
      balanceMap.set(payerId, {
        user: expense.paidBy,
        net: 0,
        paid: 0,
        owes: 0,
      });
    }

    const payer = balanceMap.get(payerId);
    payer.net = round2(payer.net + expense.totalAmount);
    payer.paid = round2(payer.paid + expense.totalAmount);

    expense.splits.forEach((split) => {
      const splitUserId = String(split.user._id || split.user);
      if (!balanceMap.has(splitUserId)) {
        balanceMap.set(splitUserId, {
          user: split.user,
          net: 0,
          paid: 0,
          owes: 0,
        });
      }
      const person = balanceMap.get(splitUserId);
      person.net = round2(person.net - split.amount);
      person.owes = round2(person.owes + split.amount);
    });
  });

  const balances = Array.from(balanceMap.values());

  const creditors = balances
    .filter((b) => b.net > EPSILON)
    .map((b) => ({ ...b, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.net < -EPSILON)
    .map((b) => ({ ...b, amount: Math.abs(b.net) }))
    .sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = round2(Math.min(debtor.amount, creditor.amount));

    if (amount > EPSILON) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount,
      });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= EPSILON) i += 1;
    if (creditor.amount <= EPSILON) j += 1;
  }

  return {
    balances,
    settlements,
    expenses,
  };
};

const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ "members.user": req.user.id })
      .populate("members.user", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateGroup = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const me = group.members.find(
      (m) => m.user._id.toString() === req.user.id.toString(),
    );
    if (!me || me.role !== "admin") {
      return res.status(403).json({ message: "Only admins can edit groups" });
    }

    const { name, icon, color } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: "Group name cannot be empty" });
      }
      group.name = String(name).trim();
    }

    if (icon !== undefined) group.icon = icon || "👥";
    if (color !== undefined) group.color = color || "#6366f1";

    await group.save();

    const updated = await Group.findById(group._id).populate(
      "members.user",
      "name email avatar",
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const me = group.members.find(
      (m) => m.user._id.toString() === req.user.id.toString(),
    );
    if (!me || me.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete groups" });
    }

    await GroupExpense.deleteMany({ group: group._id });
    await group.deleteOne();

    res.json({ message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, icon, color, memberEmails = [] } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const members = [{ user: req.user.id, role: "admin" }];
    let pendingInvites = [];

    if (Array.isArray(memberEmails) && memberEmails.length) {
      const normalizedEmails = [
        ...new Set(memberEmails.map((e) => normalizeEmail(e)).filter(Boolean)),
      ].filter((email) => email !== normalizeEmail(req.user.email));

      const users = await User.find({
        email: { $in: normalizedEmails },
      });

      const foundEmailSet = new Set(users.map((u) => normalizeEmail(u.email)));

      users.forEach((u) => {
        if (u._id.toString() !== req.user.id.toString()) {
          members.push({ user: u._id, role: "member" });
        }
      });

      pendingInvites = normalizedEmails
        .filter((email) => !foundEmailSet.has(email))
        .map((email) => ({
          email,
          invitedBy: req.user.id,
        }));
    }

    const group = await Group.create({
      name: name.trim(),
      icon: icon || "👥",
      color: color || "#6366f1",
      createdBy: req.user.id,
      members,
      pendingInvites,
    });

    let inviteStats = { attempted: pendingInvites.length, sent: 0, failed: 0 };

    if (pendingInvites.length) {
      const inviteResults = await Promise.all(
        pendingInvites.map((invite) =>
          sendGroupInviteEmail({
            toEmail: invite.email,
            inviterName: req.user.name,
            groupName: group.name,
            groupId: group._id,
          }).catch((error) => ({
            sent: false,
            reason: error.message || "send_failed",
          })),
        ),
      );

      inviteStats = {
        attempted: pendingInvites.length,
        sent: inviteResults.filter((r) => r?.sent).length,
        failed: inviteResults.filter((r) => !r?.sent).length,
      };
    }

    const populated = await Group.findById(group._id).populate(
      "members.user",
      "name email avatar",
    );
    res.status(201).json({
      ...populated.toObject(),
      inviteStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const { balances, settlements, expenses } = await buildBalances(group._id);

    res.json({ group, expenses, balances, settlements });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const addGroupMember = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const me = group.members.find(
      (m) => m.user._id.toString() === req.user.id.toString(),
    );
    if (!me || me.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (
      group.pendingInvites.some((invite) => invite.email === normalizedEmail)
    ) {
      return res
        .status(400)
        .json({ message: "Invite already sent to this email" });
    }

    if (user) {
      if (
        group.members.some((m) => m.user._id.toString() === user._id.toString())
      ) {
        return res.status(400).json({ message: "User already in group" });
      }

      group.members.push({ user: user._id, role: "member" });
      group.pendingInvites = group.pendingInvites.filter(
        (invite) => invite.email !== normalizedEmail,
      );
      await group.save();

      const mailResult = await sendGroupInviteEmail({
        toEmail: normalizedEmail,
        inviterName: req.user.name,
        groupName: group.name,
        groupId: group._id,
      }).catch((error) => ({
        sent: false,
        reason: error.message || "send_failed",
      }));

      const updated = await Group.findById(group._id).populate(
        "members.user",
        "name email avatar",
      );

      const memberAddedMessage = mailResult.sent
        ? "Member added and invitation email sent"
        : isMailerConfigured()
          ? `Member added, but invite email failed (${mailResult.reason || "send_failed"})`
          : "Member added. SMTP not configured, so invite email was not sent";

      return res.json({
        group: updated,
        status: "added",
        emailSent: Boolean(mailResult.sent),
        message: memberAddedMessage,
      });
    }

    group.pendingInvites.push({
      email: normalizedEmail,
      invitedBy: req.user.id,
    });
    await group.save();

    const mailResult = await sendGroupInviteEmail({
      toEmail: normalizedEmail,
      inviterName: req.user.name,
      groupName: group.name,
      groupId: group._id,
    }).catch((error) => ({
      sent: false,
      reason: error.message || "send_failed",
    }));

    const updated = await Group.findById(group._id).populate(
      "members.user",
      "name email avatar",
    );

    const inviteMessage = mailResult.sent
      ? "Invitation email sent successfully. User will join automatically after sign in."
      : isMailerConfigured()
        ? `Invite saved, but email could not be sent (${mailResult.reason || "send_failed"}). User can still join automatically after sign in.`
        : "Invite saved. Configure SMTP in backend .env to send real emails. User will still join automatically after sign in.";

    return res.json({
      group: updated,
      status: "invited",
      emailSent: Boolean(mailResult.sent),
      message: inviteMessage,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createGroupExpense = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const {
      icon,
      description,
      totalAmount,
      paidBy,
      splitType = "equal",
      participants = [],
      splits = [],
      date,
    } = req.body;

    if (
      !description?.trim() ||
      !Number(totalAmount) ||
      Number(totalAmount) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Description and valid total amount are required" });
    }

    const memberIdSet = new Set(
      group.members.map((m) => m.user._id.toString()),
    );
    const payerId = String(paidBy || req.user.id);

    if (!memberIdSet.has(payerId)) {
      return res.status(400).json({ message: "Payer must be a group member" });
    }

    const participantIds = (participants.length ? participants : [payerId]).map(
      (id) => String(id),
    );
    const outside = participantIds.some((id) => !memberIdSet.has(id));
    if (outside) {
      return res
        .status(400)
        .json({ message: "All participants must be group members" });
    }

    const normalizedSplits = buildSplits({
      splitType,
      participants: participantIds,
      totalAmount: Number(totalAmount),
      splitsInput: splits,
    });

    const totalSplit = normalizedSplits.reduce(
      (sum, s) => sum + Number(s.amount || 0),
      0,
    );
    if (Math.abs(totalSplit - Number(totalAmount)) > EPSILON) {
      return res
        .status(400)
        .json({ message: "Split amounts must equal total amount" });
    }

    const expense = await GroupExpense.create({
      group: group._id,
      paidBy: payerId,
      createdBy: req.user.id,
      icon: icon || "💸",
      description: description.trim(),
      totalAmount: Number(totalAmount),
      date: date || Date.now(),
      splitType,
      participants: participantIds,
      splits: normalizedSplits,
    });

    const populated = await GroupExpense.findById(expense._id)
      .populate("paidBy", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("splits.user", "name email avatar")
      .populate("participants", "name email avatar");

    res.status(201).json(populated);
  } catch (error) {
    if (error.message?.includes("split")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const updateGroupExpense = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const expense = await GroupExpense.findOne({
      _id: req.params.expenseId,
      group: group._id,
    });

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const isAdmin = group.members.some(
      (m) =>
        m.user._id.toString() === req.user.id.toString() && m.role === "admin",
    );

    if (!isAdmin && expense.createdBy.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to edit this expense" });
    }

    const {
      icon,
      description,
      totalAmount,
      paidBy,
      splitType,
      participants,
      splits,
      date,
    } = req.body;

    const memberIdSet = new Set(
      group.members.map((m) => m.user._id.toString()),
    );
    const payerId = String(paidBy || expense.paidBy);
    if (!memberIdSet.has(payerId)) {
      return res.status(400).json({ message: "Payer must be a group member" });
    }

    const participantIds = (participants || expense.participants).map((id) =>
      String(id),
    );
    if (participantIds.some((id) => !memberIdSet.has(id))) {
      return res
        .status(400)
        .json({ message: "All participants must be group members" });
    }

    const newTotal = Number(totalAmount ?? expense.totalAmount);
    const newSplitType = splitType || expense.splitType;
    const normalizedSplits = buildSplits({
      splitType: newSplitType,
      participants: participantIds,
      totalAmount: newTotal,
      splitsInput: splits || expense.splits,
    });

    if (icon !== undefined) expense.icon = icon || "💸";
    expense.description = description?.trim() ?? expense.description;
    expense.totalAmount = newTotal;
    expense.paidBy = payerId;
    expense.splitType = newSplitType;
    expense.participants = participantIds;
    expense.splits = normalizedSplits;
    if (date) expense.date = date;

    await expense.save();

    const populated = await GroupExpense.findById(expense._id)
      .populate("paidBy", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("splits.user", "name email avatar")
      .populate("participants", "name email avatar");

    res.json(populated);
  } catch (error) {
    if (error.message?.includes("split")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

const deleteGroupExpense = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const expense = await GroupExpense.findOne({
      _id: req.params.expenseId,
      group: group._id,
    });

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const isAdmin = group.members.some(
      (m) =>
        m.user._id.toString() === req.user.id.toString() && m.role === "admin",
    );

    if (!isAdmin && expense.createdBy.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this expense" });
    }

    await expense.deleteOne();
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getGroupExpenses = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const expenses = await GroupExpense.find({ group: group._id })
      .populate("paidBy", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("splits.user", "name email avatar")
      .populate("participants", "name email avatar")
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getGroupBalances = async (req, res) => {
  try {
    const group = await getGroupForUser(req.params.id, req.user.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const { balances, settlements } = await buildBalances(group._id);
    res.json({ balances, settlements });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupDetails,
  addGroupMember,
  getGroupExpenses,
  createGroupExpense,
  updateGroupExpense,
  deleteGroupExpense,
  getGroupBalances,
};

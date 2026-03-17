const Group = require("../models/Group");

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const acceptPendingInvitesForUser = async (user) => {
  const email = normalizeEmail(user?.email);
  if (!email || !user?._id) return 0;

  const groups = await Group.find({ "pendingInvites.email": email });
  let updatedCount = 0;

  for (const group of groups) {
    const alreadyMember = group.members.some(
      (m) => String(m.user) === String(user._id),
    );

    const hadPendingInvite = group.pendingInvites.some(
      (invite) => normalizeEmail(invite.email) === email,
    );

    if (!hadPendingInvite) continue;

    if (!alreadyMember) {
      group.members.push({ user: user._id, role: "member" });
    }

    group.pendingInvites = group.pendingInvites.filter(
      (invite) => normalizeEmail(invite.email) !== email,
    );

    await group.save();
    updatedCount += 1;
  }

  return updatedCount;
};

module.exports = { acceptPendingInvitesForUser };

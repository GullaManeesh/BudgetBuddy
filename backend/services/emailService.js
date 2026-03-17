const nodemailer = require("nodemailer");

const isMailerConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );
};

const getTransporter = () => {
  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").trim();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const sendGroupInviteEmail = async ({
  toEmail,
  inviterName,
  groupName,
  groupId,
}) => {
  if (!isMailerConfigured()) {
    return { sent: false, reason: "not_configured" };
  }

  const transporter = getTransporter();
  const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login?inviteGroup=${groupId}`;
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `${inviterName} invited you to join ${groupName} on BudgetBuddy`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 8px;">BudgetBuddy Group Invite</h2>
        <p><strong>${inviterName}</strong> invited you to join the group <strong>${groupName}</strong>.</p>
        <p>Sign in with this email on BudgetBuddy and you will be added to the group automatically.</p>
        <p style="margin: 24px 0;">
          <a href="${loginUrl}" style="background:#7c3aed;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;display:inline-block;">Open BudgetBuddy</a>
        </p>
        <p>If you already have an account, just sign in. If not, sign in once with Google using this email.</p>
      </div>
    `,
    text: `${inviterName} invited you to join ${groupName} on BudgetBuddy. Sign in with this email to join automatically: ${loginUrl}`,
  });

  return { sent: true };
};

const sendReminderEmail = async ({
  toEmail,
  userName,
  reminderTitle,
  reminderMessage,
  frequency,
}) => {
  if (!isMailerConfigured()) {
    return { sent: false, reason: "not_configured" };
  }

  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const dashboardUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reminders`;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `Reminder: ${reminderTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 8px;">BudgetBuddy Reminder</h2>
        <p>Hi ${userName || "there"},</p>
        <p>This is your <strong>${frequency}</strong> reminder:</p>
        <p style="font-size: 18px; margin: 14px 0;"><strong>${reminderTitle}</strong></p>
        ${reminderMessage ? `<p>${reminderMessage}</p>` : ""}
        <p style="margin: 24px 0;">
          <a href="${dashboardUrl}" style="background:#7c3aed;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;display:inline-block;">Open Reminders</a>
        </p>
      </div>
    `,
    text: `Hi ${userName || "there"}, this is your ${frequency} reminder: ${reminderTitle}${
      reminderMessage ? ` - ${reminderMessage}` : ""
    }. Open BudgetBuddy: ${dashboardUrl}`,
  });

  return { sent: true };
};

module.exports = {
  isMailerConfigured,
  sendGroupInviteEmail,
  sendReminderEmail,
};

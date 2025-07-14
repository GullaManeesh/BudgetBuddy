require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const userModel = require("./models/user");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const budgetModel = require("./models/budgetModel");
const expenseModel = require("./models/expenseModel");
const groupModel = require("./models/groupModel");
const reminderModel = require("./models/reminderModel");
const groupExpenseModel = require("./models/groupExpenseModel");
const session = require("express-session");
const calculateBalances = require("./utils/calculateBalances");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const ObjectId = mongoose.Types.ObjectId;
require("dotenv").config();

const port = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

// Make sure this is at the top with other requires
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to normalize dates (remove seconds and milliseconds)
const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  return normalized;
};

// Helper function to format time as HH:MM
const formatTime = (date) => date.toTimeString().slice(0, 5);

// Send reminder email
const sendReminderEmail = async (reminder) => {
  const mailOptions = {
    from: `"BudgetBuddy" <${process.env.EMAIL_USER}>`,
    to: reminder.email,
    subject: `⏰ Reminder: ${reminder.title}`,
    text: `Hi,\n\nThis is your ${reminder.frequency} reminder for "${
      reminder.title
    }".${
      reminder.description ? `\n\nDescription: ${reminder.description}` : ""
    }\n\nStay on track!\n\n– BudgetBuddy`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">BudgetBuddy Reminder</h2>
        <p>This is your ${reminder.frequency} reminder for: <strong>${
      reminder.title
    }</strong></p>
        ${
          reminder.description
            ? `<p>Description: ${reminder.description}</p>`
            : ""
        }
        <p>Set to remind you at: ${reminder.time || "00:00"}</p>
        <div style="margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0;">Need to make changes? <a href="${
            process.env.APP_URL || "http://localhost:3000"
          }" style="color: #3498db; text-decoration: none;">View in app</a></p>
        </div>
        <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">– Your BudgetBuddy Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${reminder.email}`);
  } catch (error) {
    console.error(`Error sending reminder email to ${reminder.email}:`, error);
  }
};
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const currentUTCDate = new Date(
      now.toISOString().slice(0, 16) + ":00.000Z"
    );

    const reminders = await reminderModel.find({
      isActive: true,
      nextReminderDate: { $lte: currentUTCDate },
    });

    for (const reminder of reminders) {
      await sendReminderEmail(reminder);

      const nextDate = new Date(reminder.nextReminderDate);
      if (reminder.frequency === "everyminute") {
        nextDate.setUTCMinutes(nextDate.getUTCMinutes() + 1);
      } else if (reminder.frequency === "daily") {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      } else if (reminder.frequency === "weekly") {
        nextDate.setUTCDate(nextDate.getUTCDate() + 7);
      } else if (reminder.frequency === "monthly") {
        nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
      }

      if (nextDate <= currentUTCDate) {
        nextDate.setUTCMinutes(currentUTCDate.getUTCMinutes() + 1);
      }

      reminder.nextReminderDate = nextDate;
      await reminder.save();
    }
  } catch (error) {
    console.error("CRON JOB ERROR:", error);
  }
});

//---------------------HOME PAGE--------------------------------------//
app.get("/", (req, res) => {
  res.render("index");
});

//-----------------------SIGNUP PAGES-----------------------------------//

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/register", async (req, res) => {
  const { username, email } = req.body;
  const user = await userModel.findOne({ email: email });
  if (!user) {
    const createdUser = await userModel.create({ username, email });

    let token = jwt.sign(
      { email: email, userid: createdUser._id },
      process.env.SESSION_SECRET
    );
    res.cookie("token", token);
    res.redirect("/dashboard");
  }
});

app.post("/registerGmail", async (req, res) => {
  const { username, email } = req.body;
  let user = await userModel.findOne({ email: email });

  if (!user) {
    user = await userModel.create({ username, email });
  }
  let token = jwt.sign(
    { email: email, userid: user._id },
    process.env.SESSION_SECRET
  );
  res.cookie("token", token);
  res.redirect("/dashboard");
});

app.post("/login", async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email: email });
  let token = jwt.sign(
    { email: email, userid: user._id },
    process.env.SESSION_SECRET
  );
  res.cookie("token", token);
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout failed");
    }

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.clearCookie("token", { path: "/" });

    res.redirect("/signup");
  });
});

//-------------------------DASHBOARD----------------------------------------//
app.get("/dashboard", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate({
    path: "budgets",
    populate: {
      path: "expenses",
    },
  });

  const reminders = await reminderModel.find({ email: req.user.email });

  const groups = await groupModel.find({ createdBy: new ObjectId(user._id) });

  const budgetsData = await budgetModel
    .find({ User: new ObjectId(user._id) })
    .sort({ _id: -1 });

  const expense = user.budgets.map((budget) => budget.expenses).flat();

  const expenses = await expenseModel
    .find({ User: new ObjectId(user._id) })
    .sort({ CreatedDate: -1 });

  let selectedGroup = null;
  let balances = {};
  let owes = {}; // Initialize owes here
  if (req.session.selGroupid) {
    selectedGroup = await groupModel
      .findOne({ _id: new ObjectId(req.session.selGroupid) })
      .populate("expenses");

    if (selectedGroup && selectedGroup.expenses && selectedGroup.members) {
      const result = calculateBalances(selectedGroup); // Get both balances and owes
      balances = result.balances;
      owes = result.owes;
    }
  }

  const budgetId = req.session.budgetId;
  let budget = "";
  if (budgetId) {
    budget = await budgetModel
      .findOne({ _id: new ObjectId(budgetId) })
      .populate("expenses");
  }

  res.render("dashboard", {
    user: user,
    budget,
    expense: JSON.stringify(expense),
    expenses,
    budgetsData: JSON.stringify(budgetsData),
    groups,
    selectedGroup,
    balances,
    owes,
    reminders,
  });
});

//--------------------------budgetSec---------------------------------------//

app.post("/createBudget", isLoggedin, async (req, res) => {
  const { budgetName, budgetAmount, budgetEmoji } = req.body;
  const user = await userModel.findOne({ email: req.user.email });
  const createBudget = await budgetModel.create({
    BudgetName: budgetName,
    BudgetAmount: Number(budgetAmount),
    icon: budgetEmoji,
    createdBy: user.username,
    BudgetRemaining: Number(budgetAmount),
    User: user._id,
  });
  user.budgets.push(createBudget._id);
  await user.save();
  res.redirect("/dashboard#budgets");
});

app.post("/editBudget", isLoggedin, async (req, res) => {
  const { budgetId, budgetName, budgetAmount, budgetEmoji } = req.body;
  const budget = await budgetModel.findOneAndUpdate(
    { _id: new ObjectId(budgetId) },
    { BudgetName: budgetName, BudgetAmount: budgetAmount, icon: budgetEmoji }
  );
  await budget.save();
  res.redirect("/dashboard#budgets");
});

app.post("/deletebudget", isLoggedin, async (req, res) => {
  const id = req.body.budgetId;
  const budget = await budgetModel.deleteOne({
    _id: new ObjectId(id),
  });
  await userModel.updateOne(
    { _id: new ObjectId(req.user.userid) },
    { $pull: { budgets: new ObjectId(id) } }
  );

  res.redirect("/dashboard#budgets");
});

//----------------------------------EXPENSE sEC------------------------------//

app.get("/expense/:budgetid", (req, res) => {
  req.session.budgetId = req.params.budgetid;
  res.redirect("/dashboard#expenses");
});

app.post("/addExpense", async (req, res) => {
  const { expenseName, expenseAmount, budgetId } = req.body;
  let budget = "";
  if (budgetId) {
    budget = await budgetModel.findOne({ _id: new ObjectId(budgetId) });
  }
  const createdExpense = await expenseModel.create({
    ExpenseName: expenseName,
    ExpenseAmount: Number(expenseAmount),
    BudgetName: budget.BudgetName,
    Budget: budget._id,
    User: budget.User,
  });

  budget.BudgetSpent += createdExpense.ExpenseAmount;
  budget.BudgetRemaining -= createdExpense.ExpenseAmount;
  budget.expenses.push(createdExpense._id);
  await budget.save();

  res.redirect("/dashboard#expenses");
});

app.get("/expense/delete/:budgetid/:expenseid", async (req, res) => {
  const expenseId = req.params.expenseid;
  const budgetId = req.params.budgetid;
  const expense = await expenseModel.findOne({
    _id: new ObjectId(expenseId),
  });
  const updatedBudget = await budgetModel.findOneAndUpdate(
    { _id: new ObjectId(budgetId) },
    {
      $pull: { expenses: new ObjectId(expenseId) },
      $inc: {
        BudgetSpent: -expense.ExpenseAmount,
        BudgetRemaining: expense.ExpenseAmount,
      },
    }
  );

  const deletedExpense = await expenseModel.deleteOne({
    _id: new ObjectId(expenseId),
  });

  res.redirect("/dashboard#expenses");
});

app.post("/expense/edit", async (req, res) => {
  const { ExpenseId, budgetId, expenseName, expenseAmount } = req.body;
  const newExpenseAmount = expenseAmount;
  const oldExpense = await expenseModel.findOne({
    _id: new ObjectId(ExpenseId),
  });

  const oldExpenseAmount = oldExpense.ExpenseAmount;

  const expense = await expenseModel.findOneAndUpdate(
    { _id: new ObjectId(ExpenseId) },
    {
      ExpenseName: expenseName,
      ExpenseAmount: Number(expenseAmount),
    }
  );
  const budget = await budgetModel.findOneAndUpdate(
    { _id: new ObjectId(budgetId) },
    {
      $inc: {
        BudgetSpent: newExpenseAmount - oldExpenseAmount,
        BudgetRemaining: oldExpenseAmount - newExpenseAmount,
      },
    }
  );
  res.redirect("/dashboard#expenses");
});

//------------------------------GROUP EXPENSES-------------------------------//

app.post("/groups/create", isLoggedin, async (req, res) => {
  const { groupName, memberNames } = req.body;
  const user = await userModel.findOne({ email: req.user.email });

  const namesArray = memberNames.split(",").map((name) => name.trim());

  const members = namesArray.map((name) => ({ name }));

  await groupModel.create({
    groupName,
    members,
    createdBy: user._id,
    createdAt: new Date(),
  });

  res.redirect("/dashboard#groupExpenses");
});

app.post("/groups/edit", isLoggedin, async (req, res) => {
  const { groupId, groupName, memberNames } = req.body;

  // Split and trim member names
  const namesArray = memberNames.split(",").map((name) => name.trim());
  const updatedMembers = namesArray.map((name) => ({ name }));

  // Update the group with new members
  await groupModel.findOneAndUpdate(
    { _id: new ObjectId(groupId), createdBy: new ObjectId(req.user.userid) },
    {
      groupName: groupName,
      members: updatedMembers,
    }
  );

  // Recalculate expenses to include new members
  const group = await groupModel.findById(groupId).populate("expenses");

  for (const expense of group.expenses) {
    const totalAmount = expense.amount;
    const splitOption = expense.splitOption;

    if (splitOption === "equal") {
      const perPerson = totalAmount / updatedMembers.length;
      expense.splits = updatedMembers.map((member) => ({
        member: member.name,
        amount: perPerson,
      }));
    } else if (splitOption === "manual") {
      // Handle manual splits if necessary
      // You may want to implement logic to recalculate manual splits here
    }

    // Update the expense in the database
    await groupExpenseModel.findByIdAndUpdate(expense._id, {
      splits: expense.splits,
    });
  }

  res.redirect("/dashboard#groupExpenses");
});
app.post("/groupExpenses/add", isLoggedin, async (req, res) => {
  const { title, amount, date, time, paidBy, splitOption, groupId, splits } =
    req.body;

  const newExpense = await groupExpenseModel.create({
    title,
    amount,
    date: new Date(date),
    time,
    paidBy,
    splitOption,
    groupId,
    userId: req.user.userid,
    splits: splitOption === "manual" ? JSON.parse(splits) : [],
  });

  await groupModel.findByIdAndUpdate(groupId, {
    $push: { expenses: newExpense._id },
  });

  res.redirect(`/dashboard#groupExpenses`);
});

app.post("/groups/:selGroupid", async (req, res) => {
  req.session.selGroupid = req.params.selGroupid;

  res.redirect("/dashboard#groupExpenses");
});

app.post("/groupExpenses/edit", async (req, res) => {
  const { expenseId, title, amount, date, paidBy, splitOption, splits } =
    req.body;

  // Handle case where splits is empty or not valid
  let parsedSplits = [];
  try {
    if (splitOption === "manual") {
      parsedSplits = splits ? JSON.parse(splits) : [];
    }
  } catch (error) {
    console.error("Error parsing splits:", error);
    parsedSplits = [];
  }

  // Update the expense in the database
  await groupExpenseModel.findByIdAndUpdate(expenseId, {
    title,
    amount,
    date: new Date(date),
    paidBy,
    splitOption,
    splits: parsedSplits, // Save the manual splits if applicable
  });

  // Redirect to the previous page (or wherever necessary)
  res.redirect("/dashboard#groupExpenses");
});

// Delete group expense
app.post("/groupExpenses/delete", async (req, res) => {
  const { expenseId, groupId } = req.body;

  await groupExpenseModel.findByIdAndDelete(expenseId);

  await groupModel.findByIdAndUpdate(groupId, {
    $pull: { expenses: expenseId },
  });

  res.redirect("/dashboard#groupExpenses");
});

app.get("/group/:groupId/delete", async (req, res) => {
  const groupid = req.params.groupId;

  await groupExpenseModel.deleteMany({
    groupId: new ObjectId(groupid),
  });
  await groupModel.findByIdAndDelete(groupid);
  res.redirect("/dashboard#groupExpenses");
});

// Add this to your server.js
app.post("/groups/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId)
      .populate("expenses")
      .populate("settlements");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Calculate balances safely
    let balances, owes;
    try {
      const result = calculateBalances(group);
      balances = result.balances;
      owes = result.owes;
    } catch (calcError) {
      console.error("Balance calculation error:", calcError);
      return res.status(500).json({ error: "Failed to calculate balances" });
    }

    res.json({
      group,
      balances,
      owes,
    });
  } catch (error) {
    console.error("Group details error:", error);
    res.status(500).json({ error: "Failed to load group details" });
  }
});

// Settlement route
app.post("/settle", isLoggedin, async (req, res) => {
  try {
    const { from, to, amount, groupId, paymentMethod, date, note } = req.body;

    // Validate inputs
    if (!from || !to || !amount || !groupId || !paymentMethod || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert amount to number
    const settlementAmount = parseFloat(amount);
    if (isNaN(settlementAmount) || settlementAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Create settlement record
    const settlement = {
      from,
      to,
      amount: settlementAmount,
      paymentMethod,
      date: new Date(date),
      note: note || "",
      settledAt: new Date(),
    };

    // Update group with new settlement
    const updatedGroup = await groupModel
      .findByIdAndUpdate(
        groupId,
        { $push: { settlements: settlement } },
        { new: true }
      )
      .populate("expenses");

    if (!updatedGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Recalculate ALL balances
    const result = calculateBalances(updatedGroup);

    // Return the updated data
    res.json({
      success: true,
      balances: result.balances,
      owes: result.owes,
      settlements: updatedGroup.settlements,
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Settlement error:", error);
    res.status(500).json({ error: "Failed to process settlement" });
  }
});

//-------------------------------reminders----------------------------------//
app.post("/reminder/add", isLoggedin, async (req, res) => {
  const {
    title,
    description,
    frequency,
    time = "00:00",
    day,
    date,
    customDays,
  } = req.body;

  // Helper to calculate initial UTC reminder time
  const calculateInitialReminderTime = () => {
    const now = new Date();
    const utcNow = new Date(now.toISOString().slice(0, 16) + ":00.000Z");

    if (frequency === "everyminute") {
      // Start at the beginning of the next minute
      const next = new Date(utcNow);
      next.setUTCMinutes(next.getUTCMinutes() + 1);
      next.setUTCSeconds(0);
      next.setUTCMilliseconds(0);
      return next;
    }

    // For other frequencies
    const [hours, minutes] = time.split(":").map(Number);
    const target = new Date(utcNow);

    // Set the target time
    target.setUTCHours(hours, minutes, 0, 0);

    // Adjust based on frequency
    if (frequency === "daily") {
      if (target <= now) {
        target.setUTCDate(target.getUTCDate() + 1);
      }
    } else if (frequency === "custom") {
      const daysToAdd = parseInt(customDays) || 1;
      target.setUTCDate(target.getUTCDate() + daysToAdd);

      // If we're still in the past (can happen with custom intervals)
      while (target <= now) {
        target.setUTCDate(target.getUTCDate() + daysToAdd);
      }
    } else if (frequency === "weekly") {
      const currentDay = now.getUTCDay();
      const targetDay = parseInt(day);
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0 && target <= now) daysToAdd = 7;
      target.setUTCDate(target.getUTCDate() + daysToAdd);
    } else if (frequency === "monthly") {
      target.setUTCMonth(target.getUTCMonth() + 1);
      target.setUTCDate(parseInt(date));

      // Handle invalid dates (e.g., Feb 31)
      if (target.getUTCDate() !== parseInt(date)) {
        target.setUTCDate(0); // Last day of previous month
      }
    }

    return target;
  };

  try {
    const nextReminderDate = calculateInitialReminderTime();

    // Create the new reminder
    const newReminder = await reminderModel.create({
      userId: req.user.userid,
      title,
      description: description || undefined,
      frequency,
      customDays: frequency === "custom" ? parseInt(customDays) : undefined,
      time,
      day: frequency === "weekly" ? parseInt(day) : undefined,
      date: frequency === "monthly" ? parseInt(date) : undefined,
      nextReminderDate,
      email: req.user.email,
      isActive: true,
    });

    // Add the reminder ID to the user's reminders array
    await userModel.findByIdAndUpdate(
      req.user.userid,
      { $push: { reminders: newReminder._id } },
      { new: true }
    );

    res.redirect("/dashboard#reminders");
  } catch (error) {
    console.error("REMINDER CREATION ERROR:", error);
    res.redirect("/dashboard#reminders");
  }
});

app.post("/reminder/delete/:reminderId", isLoggedin, async (req, res) => {
  const reminderId = req.params.reminderId;
  const userId = req.user.userid;
  await reminderModel.findByIdAndDelete(reminderId);

  await userModel.findByIdAndUpdate(userId, {
    $pull: { reminders: reminderId },
  });

  res.redirect("/dashboard#reminders");
});
//---------------------------------------------------------------------------//
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function isLoggedin(req, res, next) {
  const tok = req.cookies.token;
  if (!tok) {
    return res.status(401).redirect("/signup");
  } else {
    let data = jwt.verify(tok, process.env.SESSION_SECRET);
    req.user = data;
  }
  next();
}

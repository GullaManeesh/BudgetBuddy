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
const groupExpenseModel = require("./models/groupExpenseModel");
const session = require("express-session");
const calculateBalances = require("./utils/calculateBalances");

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

//----------------------HOME PAGE--------------------------------------//
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

  console.log(expenseId);

  await groupExpenseModel.findByIdAndDelete(expenseId);

  await groupModel.findByIdAndUpdate(groupId, {
    $pull: { expenses: expenseId },
  });

  res.redirect("/dashboard#groupExpenses");
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

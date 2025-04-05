const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const userModel = require("./models/user");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const budgetModel = require("./models/budgetModel");
const expenseModel = require("./models/expenseModel");
const session = require("express-session");
const ObjectId = mongoose.Types.ObjectId;
require("dotenv").config();

const port = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
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
  res.clearCookie("token");
  res.redirect("/signup");
});

//-------------------------DASHBOARD----------------------------------------//
app.get("/dashboard", isLoggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate({
    path: "budgets",
    populate: {
      path: "expenses",
    },
  });
  const expense = user.budgets.map((budget) => budget.expenses).flat();

  const budgetId = req.session.budgetId;
  let budget = "";
  if (budgetId) {
    budget = await budgetModel
      .findOne({ _id: new ObjectId(budgetId) })
      .populate("expenses");
  }
  console.log(expense);
  res.render("dashboard", {
    user: user,
    budget,
    expense: JSON.stringify(expense),
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

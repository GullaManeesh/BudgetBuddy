const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

const getExpenses = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.budgetId) filter.budget = req.query.budgetId;

    const expenses = await Expense.find(filter)
      .populate("budget", "name icon color")
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createExpense = async (req, res) => {
  try {
    const { budgetId, name, amount, date } = req.body;
    if (!budgetId || !name || !amount) {
      return res
        .status(400)
        .json({ message: "budgetId, name and amount are required" });
    }

    const budget = await Budget.findOne({ _id: budgetId, user: req.user.id });
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    const expense = await Expense.create({
      user: req.user.id,
      budget: budgetId,
      name,
      amount,
      date: date || Date.now(),
    });

    const populated = await expense.populate("budget", "name icon color");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const { budgetId, name, amount, date } = req.body;

    if (budgetId) {
      const budget = await Budget.findOne({ _id: budgetId, user: req.user.id });
      if (!budget) return res.status(404).json({ message: "Budget not found" });
      expense.budget = budgetId;
    }

    if (name !== undefined) expense.name = name;
    if (amount !== undefined) expense.amount = amount;
    if (date !== undefined) expense.date = date;

    await expense.save();
    const populated = await expense.populate("budget", "name icon color");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    await expense.deleteOne();
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };

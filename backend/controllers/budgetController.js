const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await Expense.find({ budget: budget._id });
        const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
        return { ...budget.toObject(), spent };
      }),
    );

    res.json(budgetsWithSpent);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createBudget = async (req, res) => {
  try {
    const { name, icon, amount, color } = req.body;
    if (!name || !amount) {
      return res.status(400).json({ message: "Name and amount are required" });
    }
    const budget = await Budget.create({
      user: req.user.id,
      name,
      icon: icon || "💰",
      amount,
      color: color || "#a855f7",
    });
    res.status(201).json({ ...budget.toObject(), spent: 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    const { name, icon, amount, color } = req.body;
    if (name !== undefined) budget.name = name;
    if (icon !== undefined) budget.icon = icon;
    if (amount !== undefined) budget.amount = amount;
    if (color !== undefined) budget.color = color;

    await budget.save();

    const expenses = await Expense.find({ budget: budget._id });
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ ...budget.toObject(), spent });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!budget) return res.status(404).json({ message: "Budget not found" });

    await Expense.deleteMany({ budget: budget._id });
    await budget.deleteOne();

    res.json({ message: "Budget deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };

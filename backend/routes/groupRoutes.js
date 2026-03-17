const express = require("express");
const {
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
} = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getGroups);
router.post("/", createGroup);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);
router.get("/:id", getGroupDetails);
router.post("/:id/members", addGroupMember);

router.get("/:id/expenses", getGroupExpenses);
router.post("/:id/expenses", createGroupExpense);
router.put("/:id/expenses/:expenseId", updateGroupExpense);
router.delete("/:id/expenses/:expenseId", deleteGroupExpense);

router.get("/:id/balances", getGroupBalances);

module.exports = router;

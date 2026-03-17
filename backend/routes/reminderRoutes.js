const express = require("express");
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
} = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getReminders);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.patch("/:id/toggle", toggleReminder);
router.delete("/:id", deleteReminder);

module.exports = router;

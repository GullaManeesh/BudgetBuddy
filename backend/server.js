require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User");
const connectDB = require("./config/db");
const {
  acceptPendingInvitesForUser,
} = require("./services/groupInviteService");

const authRoutes = require("./routes/authRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const {
  startReminderScheduler,
} = require("./services/reminderSchedulerService");

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(passport.initialize());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value || "",
          });
        }

        await acceptPendingInvitesForUser(user);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

app.use("/api/auth", authRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/reminders", reminderRoutes);

app.get("/", (req, res) => res.json({ message: "BudgetBuddy API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  startReminderScheduler();
});

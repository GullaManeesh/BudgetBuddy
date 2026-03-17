const express = require("express");
const passport = require("passport");
const { googleCallback, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err || !user) {
        const reason =
          err?.message ||
          info?.message ||
          req.query?.error_description ||
          req.query?.error ||
          "unknown";
        return res.redirect(
          `${process.env.CLIENT_URL}/login?error=auth_failed&reason=${encodeURIComponent(reason)}`,
        );
      }
      req.user = user;
      return next();
    })(req, res, next);
  },
  googleCallback,
);

router.get("/me", protect, getMe);

module.exports = router;

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected test route
router.get("/me", auth, async (req, res) => {
  const pool = require("../config/database");
  const result = await pool.query(
    "SELECT id, username, email, show_nsfw FROM users WHERE id = $1",
    [req.user.userId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const user = result.rows[0];
  res.json({
    message: "Auth is working!",
    user: {
      id: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      show_nsfw: user.show_nsfw,
    },
  });
});

module.exports = router;

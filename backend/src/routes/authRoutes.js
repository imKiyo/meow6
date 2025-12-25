const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected test route
router.get("/me", auth, async (req, res) => {
  res.json({
    message: "Auth is working!",
    user: req.user,
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Toggle favorite
router.post("/:gifId", favoritesController.toggleFavorite);

// Get user's favorites
router.get("/", favoritesController.getFavorites);

// Check if GIFs are favorited
router.get("/check", favoritesController.checkFavorites);

module.exports = router;

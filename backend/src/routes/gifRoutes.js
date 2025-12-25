const express = require("express");
const router = express.Router();
const gifController = require("../controllers/gifController");
const auth = require("../middleware/auth");
const upload = require("../config/upload");

// Upload GIF (protected)
router.post("/upload", auth, upload.single("gif"), gifController.uploadGif);

// Get all GIFs (public)
router.get("/", gifController.getGifs);

// Get single GIF (public)
router.get("/:id", gifController.getGifById);

// Delete GIF (protected)
router.delete("/:id", auth, gifController.deleteGif);

module.exports = router;

const express = require("express");
const router = express.Router();
const gifController = require("../controllers/gifController");
const auth = require("../middleware/auth");
const upload = require("../config/upload");

// Upload GIF (protected)
router.post("/upload", auth, upload.single("gif"), gifController.uploadGif);

// Get all GIFs (protected - needs auth for NSFW filtering)
router.get("/", auth, gifController.getGifs);

// Get single GIF (protected)
router.get("/:id", auth, gifController.getGifById);

// Get related GIFs (protected)
router.get("/:id/related", auth, gifController.getRelatedGifs);

// Delete GIF (protected)
router.delete("/:id", auth, gifController.deleteGif);

module.exports = router;

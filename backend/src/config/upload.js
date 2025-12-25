const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure storage directories exist
const ensureStorageDirectories = () => {
  const storagePath = path.join(__dirname, "../../storage");
  const gifsPath = path.join(storagePath, "gifs");
  const thumbnailsPath = path.join(storagePath, "thumbnails");

  [storagePath, gifsPath, thumbnailsPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

ensureStorageDirectories();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../storage/gifs");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - only accept GIFs
const fileFilter = (req, file, cb) => {
  // Check mimetype
  if (file.mimetype === "image/gif") {
    cb(null, true);
  } else {
    cb(new Error("Only GIF files are allowed!"), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 20971520, // 20MB default
  },
});

module.exports = upload;

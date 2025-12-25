const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

/**
 * Get GIF metadata
 */
const getGifMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      size: metadata.size,
      format: metadata.format,
    };
  } catch (error) {
    console.error("Error getting GIF metadata:", error);
    throw error;
  }
};

/**
 * Generate thumbnail from GIF (first frame)
 */
const generateThumbnail = async (gifPath, outputPath, maxWidth = 320) => {
  try {
    await sharp(gifPath, { animated: false })
      .resize(maxWidth, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw error;
  }
};

/**
 * Delete file
 */
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

/**
 * Get file size
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error("Error getting file size:", error);
    return 0;
  }
};

module.exports = {
  getGifMetadata,
  generateThumbnail,
  deleteFile,
  getFileSize,
};

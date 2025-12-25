const pool = require("../config/database");
const path = require("path");
const {
  getGifMetadata,
  generateThumbnail,
  deleteFile,
  getFileSize,
} = require("../utils/fileProcessor");

/**
 * Upload a new GIF
 */
exports.uploadGif = async (req, res) => {
  const client = await pool.connect();

  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { tags } = req.body;

    // Validate tags
    if (!tags || tags.trim().length === 0) {
      await deleteFile(req.file.path);
      return res.status(400).json({ error: "At least one tag is required" });
    }

    // Parse tags (comma-separated)
    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    if (tagArray.length < 3) {
      await deleteFile(req.file.path);
      return res.status(400).json({ error: "At least 3 tags are required" });
    }

    // Get file metadata
    const metadata = await getGifMetadata(req.file.path);
    const fileSize = await getFileSize(req.file.path);

    // Generate thumbnail
    const thumbnailPath = path.join(
      path.dirname(req.file.path).replace("gifs", "thumbnails"),
      `${path.basename(req.file.filename, path.extname(req.file.filename))}.webp`,
    );
    await generateThumbnail(req.file.path, thumbnailPath);

    // Start transaction
    await client.query("BEGIN");

    // Create relative paths for storage
    const relativeGifPath = `storage/gifs/${req.file.filename}`;
    const relativeThumbnailPath = `storage/thumbnails/${path.basename(req.file.filename, path.extname(req.file.filename))}.webp`;

    // Insert GIF record
    const gifResult = await client.query(
      `INSERT INTO gifs (uploader_id, filename, storage_path, thumbnail_path, file_size, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        req.file.originalname,
        relativeGifPath,
        relativeThumbnailPath,
        fileSize,
        metadata.width,
        metadata.height,
      ],
    );

    const gif = gifResult.rows[0];

    // Insert tags and associate with GIF
    for (const tagName of tagArray) {
      // Insert or get tag
      const tagResult = await client.query(
        `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET usage_count = tags.usage_count + 1
         RETURNING id`,
        [tagName],
      );

      const tagId = tagResult.rows[0].id;

      // Associate tag with GIF
      await client.query(
        `INSERT INTO gif_tags (gif_id, tag_id, added_by)
         VALUES ($1, $2, $3)`,
        [gif.id, tagId, req.user.userId],
      );
    }

    // Commit transaction
    await client.query("COMMIT");

    // Get complete GIF data with tags
    const completeGifResult = await pool.query(
      `SELECT g.*,
              array_agg(t.name) as tags,
              u.username as uploader_username
       FROM gifs g
       LEFT JOIN gif_tags gt ON g.id = gt.gif_id
       LEFT JOIN tags t ON gt.tag_id = t.id
       LEFT JOIN users u ON g.uploader_id = u.id
       WHERE g.id = $1
       GROUP BY g.id, u.username`,
      [gif.id],
    );

    res.status(201).json({
      message: "GIF uploaded successfully",
      gif: completeGifResult.rows[0],
    });
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");

    console.error("Upload error:", error);

    // Clean up uploaded file if it exists
    if (req.file) {
      await deleteFile(req.file.path);
    }

    res.status(500).json({ error: "Failed to upload GIF" });
  } finally {
    client.release();
  }
};

/**
 * Get all GIFs with filters
 */
exports.getGifs = async (req, res) => {
  try {
    const {
      search,
      tags,
      sortBy = "recent",
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT DISTINCT g.*,
             array_agg(DISTINCT t.name) as tags,
             u.username as uploader_username
      FROM gifs g
      LEFT JOIN gif_tags gt ON g.id = gt.gif_id
      LEFT JOIN tags t ON gt.tag_id = t.id
      LEFT JOIN users u ON g.uploader_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim().toLowerCase());
      query += ` AND EXISTS (
        SELECT 1 FROM gif_tags gt2
        JOIN tags t2 ON gt2.tag_id = t2.id
        WHERE gt2.gif_id = g.id AND t2.name = ANY($${paramCount})
      )`;
      params.push(tagArray);
      paramCount++;
    }

    // Search in tags and uploader
    if (search) {
      query += ` AND (
        EXISTS (
          SELECT 1 FROM gif_tags gt3
          JOIN tags t3 ON gt3.tag_id = t3.id
          WHERE gt3.gif_id = g.id AND t3.name ILIKE $${paramCount}
        ) OR u.username ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY g.id, u.username`;

    // Sorting
    if (sortBy === "popular") {
      query += ` ORDER BY g.favorite_count DESC, g.uploaded_at DESC`;
    } else {
      query += ` ORDER BY g.uploaded_at DESC`;
    }

    // Pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT g.id) as total FROM gifs g`;
    if (tags || search) {
      countQuery += ` LEFT JOIN gif_tags gt ON g.id = gt.gif_id
                      LEFT JOIN tags t ON gt.tag_id = t.id
                      LEFT JOIN users u ON g.uploader_id = u.id
                      WHERE 1=1`;

      if (tags) {
        const tagArray = tags.split(",").map((t) => t.trim().toLowerCase());
        countQuery += ` AND EXISTS (
          SELECT 1 FROM gif_tags gt2
          JOIN tags t2 ON gt2.tag_id = t2.id
          WHERE gt2.gif_id = g.id AND t2.name = ANY($1)
        )`;
      }

      if (search) {
        countQuery += ` AND (t.name ILIKE $${tags ? 2 : 1} OR u.username ILIKE $${tags ? 2 : 1})`;
      }
    }

    const countResult = await pool.query(
      countQuery,
      tags && search
        ? [tags.split(",").map((t) => t.trim().toLowerCase()), `%${search}%`]
        : tags
          ? [tags.split(",").map((t) => t.trim().toLowerCase())]
          : search
            ? [`%${search}%`]
            : [],
    );

    res.json({
      gifs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Get GIFs error:", error);
    res.status(500).json({ error: "Failed to fetch GIFs" });
  }
};

/**
 * Get single GIF by ID
 */
exports.getGifById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT g.*,
              array_agg(t.name) as tags,
              u.username as uploader_username
       FROM gifs g
       LEFT JOIN gif_tags gt ON g.id = gt.gif_id
       LEFT JOIN tags t ON gt.tag_id = t.id
       LEFT JOIN users u ON g.uploader_id = u.id
       WHERE g.id = $1
       GROUP BY g.id, u.username`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "GIF not found" });
    }

    // Increment view count
    await pool.query(
      "UPDATE gifs SET view_count = view_count + 1 WHERE id = $1",
      [id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get GIF error:", error);
    res.status(500).json({ error: "Failed to fetch GIF" });
  }
};

/**
 * Delete GIF
 */
exports.deleteGif = async (req, res) => {
  try {
    const { id } = req.params;

    // Get GIF to check ownership and get file paths
    const gifResult = await pool.query("SELECT * FROM gifs WHERE id = $1", [
      id,
    ]);

    if (gifResult.rows.length === 0) {
      return res.status(404).json({ error: "GIF not found" });
    }

    const gif = gifResult.rows[0];

    // Check if user owns the GIF
    if (gif.uploader_id !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this GIF" });
    }

    // Delete files
    await deleteFile(gif.storage_path);
    await deleteFile(gif.thumbnail_path);

    // Delete from database (cascades to gif_tags, etc.)
    await pool.query("DELETE FROM gifs WHERE id = $1", [id]);

    res.json({ message: "GIF deleted successfully" });
  } catch (error) {
    console.error("Delete GIF error:", error);
    res.status(500).json({ error: "Failed to delete GIF" });
  }
};

/**
 * Get related GIFs based on tags
 */
exports.getRelatedGifs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 8 } = req.query;

    // Get current GIF's tags
    const tagsResult = await pool.query(
      `SELECT t.name
       FROM gif_tags gt
       JOIN tags t ON gt.tag_id = t.id
       WHERE gt.gif_id = $1`,
      [id],
    );

    if (tagsResult.rows.length === 0) {
      return res.json({ gifs: [] });
    }

    const tags = tagsResult.rows.map((row) => row.name);

    // Find GIFs with similar tags
    const result = await pool.query(
      `SELECT DISTINCT g.*,
              array_agg(DISTINCT t.name) as tags,
              u.username as uploader_username,
              COUNT(DISTINCT gt2.tag_id) as matching_tags
       FROM gifs g
       JOIN gif_tags gt ON g.id = gt.gif_id
       JOIN tags t ON gt.tag_id = t.id
       LEFT JOIN gif_tags gt2 ON g.id = gt2.gif_id AND EXISTS (
         SELECT 1 FROM tags t2 WHERE t2.id = gt2.tag_id AND t2.name = ANY($2)
       )
       LEFT JOIN users u ON g.uploader_id = u.id
       WHERE g.id != $1
         AND EXISTS (
           SELECT 1 FROM gif_tags gt3
           JOIN tags t3 ON gt3.tag_id = t3.id
           WHERE gt3.gif_id = g.id AND t3.name = ANY($2)
         )
       GROUP BY g.id, u.username
       ORDER BY matching_tags DESC, g.favorite_count DESC, g.uploaded_at DESC
       LIMIT $3`,
      [id, tags, limit],
    );

    res.json({ gifs: result.rows });
  } catch (error) {
    console.error("Get related GIFs error:", error);
    res.status(500).json({ error: "Failed to fetch related GIFs" });
  }
};

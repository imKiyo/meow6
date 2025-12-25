const pool = require("../config/database");

/**
 * Toggle favorite status for a GIF
 */
exports.toggleFavorite = async (req, res) => {
  const client = await pool.connect();

  try {
    const { gifId } = req.params;
    const userId = req.user.userId;

    // Check if GIF exists
    const gifCheck = await client.query("SELECT id FROM gifs WHERE id = $1", [
      gifId,
    ]);

    if (gifCheck.rows.length === 0) {
      return res.status(404).json({ error: "GIF not found" });
    }

    // Check if already favorited
    const favoriteCheck = await client.query(
      "SELECT * FROM favorites WHERE user_id = $1 AND gif_id = $2",
      [userId, gifId],
    );

    await client.query("BEGIN");

    let isFavorited;

    if (favoriteCheck.rows.length > 0) {
      // Remove favorite
      await client.query(
        "DELETE FROM favorites WHERE user_id = $1 AND gif_id = $2",
        [userId, gifId],
      );

      // Decrement favorite count
      await client.query(
        "UPDATE gifs SET favorite_count = favorite_count - 1 WHERE id = $1",
        [gifId],
      );

      isFavorited = false;
    } else {
      // Add favorite
      await client.query(
        "INSERT INTO favorites (user_id, gif_id) VALUES ($1, $2)",
        [userId, gifId],
      );

      // Increment favorite count
      await client.query(
        "UPDATE gifs SET favorite_count = favorite_count + 1 WHERE id = $1",
        [gifId],
      );

      isFavorited = true;
    }

    await client.query("COMMIT");

    // Get updated favorite count
    const updatedGif = await pool.query(
      "SELECT favorite_count FROM gifs WHERE id = $1",
      [gifId],
    );

    res.json({
      isFavorited,
      favoriteCount: updatedGif.rows[0].favorite_count,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Toggle favorite error:", error);
    res.status(500).json({ error: "Failed to toggle favorite" });
  } finally {
    client.release();
  }
};

/**
 * Get user's favorited GIFs
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT g.*,
              array_agg(t.name) as tags,
              u.username as uploader_username,
              f.created_at as favorited_at
       FROM favorites f
       JOIN gifs g ON f.gif_id = g.id
       LEFT JOIN gif_tags gt ON g.id = gt.gif_id
       LEFT JOIN tags t ON gt.tag_id = t.id
       LEFT JOIN users u ON g.uploader_id = u.id
       WHERE f.user_id = $1
       GROUP BY g.id, u.username, f.created_at
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) as total FROM favorites WHERE user_id = $1",
      [userId],
    );

    res.json({
      gifs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
};

/**
 * Check if GIFs are favorited by current user
 */
exports.checkFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gifIds } = req.query; // Comma-separated list

    if (!gifIds) {
      return res.json({ favorites: {} });
    }

    const gifIdArray = gifIds.split(",");

    const result = await pool.query(
      "SELECT gif_id FROM favorites WHERE user_id = $1 AND gif_id = ANY($2)",
      [userId, gifIdArray],
    );

    // Create a map of gif_id => true for favorited GIFs
    const favorites = {};
    result.rows.forEach((row) => {
      favorites[row.gif_id] = true;
    });

    res.json({ favorites });
  } catch (error) {
    console.error("Check favorites error:", error);
    res.status(500).json({ error: "Failed to check favorites" });
  }
};

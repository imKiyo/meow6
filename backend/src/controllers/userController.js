const pool = require("../config/database");

exports.updateSettings = async (req, res) => {
  try {
    const { show_nsfw } = req.body;
    const userId = req.user.userId;

    await pool.query("UPDATE users SET show_nsfw = $1 WHERE id = $2", [
      show_nsfw,
      userId,
    ]);

    res.json({ message: "Settings updated", show_nsfw });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

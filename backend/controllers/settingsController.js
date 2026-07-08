const pool = require("../config/db");

exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT setting_key, setting_value FROM app_settings");
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { setting_key, setting_value } = req.body;

  if (!setting_key || setting_value === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await pool.execute(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [setting_key, String(setting_value)]
    );
    res.json({ message: "Setting updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

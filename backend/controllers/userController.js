const pool = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getUsers = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const [users] = await pool.execute(`
      SELECT id, email, role, category_name, is_active, created_at, block_demands
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.toggleBlockDemands = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }
  const { id } = req.params;
  const { block_demands } = req.body;
  try {
    await pool.execute("UPDATE users SET block_demands = ? WHERE id = ?", [block_demands ? 1 : 0, id]);
    res.json({ message: "User demand block status updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update demand block status", error: err.message });
  }
};


exports.createUser = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { email, password, role, category_name } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required." });
  }

  try {
    // Check if email exists
    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const catName = role === "CATEGORY" ? category_name || null : null;

    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, role, category_name, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [email, hash, role, catName]
    );

    res.status(201).json({ message: "User created successfully", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { id } = req.params;

  try {
    // Cannot delete self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    // If foreign key constraint fails, we should handle it or just let the 500 happen
    res.status(500).json({ message: "Failed to delete user. They may have dependent records.", error: err.message });
  }
};

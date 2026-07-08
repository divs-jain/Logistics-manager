const pool = require("../config/db");

function normalizeUnit(value) {
  if (value === null || value === undefined) return "";

  const trimmed = String(value).trim();
  if (!trimmed) return "";

  const cleaned = trimmed
    .replace(/\b\d+(?:\.\d+)?\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  const parts = cleaned.split(" ");
  return parts[parts.length - 1] || cleaned;
}

exports.getInventory = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, unit, quantity, location FROM inventory_items ORDER BY name"
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.addInventoryItem = async (req, res) => {
  try {
    const { name, unit, quantity, location } = req.body;
    const normalizedUnit = normalizeUnit(unit);

    if (!name || !unit || !quantity) {
      return res.status(400).json({
        message: "Name, unit, and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero",
      });
    }

    const [results] = await pool.execute(
      "SELECT id, quantity FROM inventory_items WHERE LOWER(name)=LOWER(?) AND unit=?",
      [name, normalizedUnit]
    );

    if (results.length > 0) {
      const item = results[0];
      const newQty = item.quantity + quantity;

      await pool.execute(
        "UPDATE inventory_items SET quantity=? WHERE id=?",
        [newQty, item.id]
      );

      return res.json({
        message: "Item exists, quantity updated",
        item_id: item.id,
        new_quantity: newQty,
      });
    }

    const [insertResult] = await pool.execute(
      `INSERT INTO inventory_items
      (name, unit, quantity, location, created_by)
      VALUES (?, ?, ?, ?, ?)`,
      [name, normalizedUnit, quantity, location || null, req.user.id]
    );

    return res.json({
      message: "New item created",
      item_id: insertResult.insertId,
    });

  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.updateInventoryQuantity = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { change } = req.body;

    if (typeof change !== "number") {
      return res.status(400).json({
        message: "Change must be a number",
      });
    }

    const [rows] = await pool.execute(
      "SELECT quantity FROM inventory_items WHERE id=?",
      [itemId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const newQty = rows[0].quantity + change;

    if (newQty < 0) {
      return res.status(400).json({
        message: "Resulting quantity cannot be negative",
      });
    }

    await pool.execute(
      "UPDATE inventory_items SET quantity=? WHERE id=?",
      [newQty, itemId]
    );

    return res.json({
      message: "Quantity updated",
      new_quantity: newQty,
    });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.updateInventoryDetails = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { name, unit, location } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ message: "Name and unit are required" });
    }

    const normalizedUnit = unit.toUpperCase();

    // Check for duplicates
    const [existing] = await pool.execute(
      "SELECT id FROM inventory_items WHERE LOWER(name)=LOWER(?) AND unit=? AND id != ?",
      [name, normalizedUnit, itemId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Another item with this name and unit already exists." });
    }

    await pool.execute(
      "UPDATE inventory_items SET name=?, unit=?, location=? WHERE id=?",
      [name, normalizedUnit, location || null, itemId]
    );

    return res.json({ message: "Item details updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    // Check if it's mapped to any demands
    const [mappings] = await pool.execute(
      "SELECT id FROM demand_inventory_mapping WHERE inventory_item_id = ?",
      [itemId]
    );

    if (mappings.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete item because it is currently mapped to one or more demands."
      });
    }

    await pool.execute("DELETE FROM inventory_items WHERE id = ?", [itemId]);

    return res.json({ message: "Item deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Database error" });
  }
};

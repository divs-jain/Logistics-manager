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

exports.createDemandBatch = async (req, res) => {
  try {
    if (req.user.role !== "CC" && req.user.role !== "CATEGORY") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "CATEGORY") {
      const [users] = await pool.execute("SELECT block_demands FROM users WHERE id = ?", [req.user.id]);
      if (users.length > 0 && users[0].block_demands) {
        return res.status(403).json({ message: "Demand entering is currently blocked for your category." });
      }
    }

    const { category_user_id } = req.body;
    const targetCategoryUserId = req.user.role === "CATEGORY" ? req.user.id : Number(category_user_id);

    if (req.user.role === "CC") {
      if (!targetCategoryUserId) {
        return res.status(400).json({ message: "Category user is required" });
      }

      const [targets] = await pool.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'CATEGORY'",
        [targetCategoryUserId]
      );
      if (targets.length === 0) {
        return res.status(400).json({ message: "Selected user is not a category account" });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO category_demands (category_user_id, imported_by)
       VALUES (?, ?)`,
      [targetCategoryUserId, req.user.id]
    );

    return res.json({
      message: "Demand batch created",
      demand_id: result.insertId,
    });

  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.addDemandItem = async (req, res) => {
  try {
    if (req.user.role !== "CC" && req.user.role !== "CATEGORY") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "CATEGORY") {
      const [users] = await pool.execute("SELECT block_demands FROM users WHERE id = ?", [req.user.id]);
      if (users.length > 0 && users[0].block_demands) {
        return res.status(403).json({ message: "Demand entering is currently blocked for your category." });
      }
    }

    const { raw_item_name, unit } = req.body;
    const requested_qty = Number(req.body.requested_qty);
    const demandId = req.params.demandId;
    const normalizedUnit = normalizeUnit(unit);

    if (!raw_item_name || !String(raw_item_name).trim()) {
      return res.status(400).json({ message: "Item name is required" });
    }

    if (!Number.isInteger(requested_qty) || requested_qty <= 0) {
      return res.status(400).json({ message: "Requested quantity must be a positive whole number" });
    }

    const [demandRows] = await pool.execute(
      "SELECT category_user_id FROM category_demands WHERE id = ?",
      [demandId]
    );

    if (demandRows.length === 0) {
      return res.status(404).json({ message: "Demand batch not found" });
    }

    if (req.user.role === "CATEGORY" && demandRows[0].category_user_id !== req.user.id) {
      return res.status(403).json({ message: "You can only add items to your own demand batch" });
    }

    const [result] = await pool.execute(
      `INSERT INTO demand_items
      (demand_id, raw_item_name, unit, requested_qty)
      VALUES (?, ?, ?, ?)`,
      [demandId, String(raw_item_name).trim(), normalizedUnit, requested_qty]
    );

    return res.json({
      message: "Demand item added",
      demand_item_id: result.insertId,
    });

  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.getDemands = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    if (role === "OC") {
      return res.status(403).json({ message: "Access denied" });
    }

    let query = `
      SELECT 
        cd.id AS demand_id,
        cd.created_at,
        u.category_name,
        di.id AS item_id,
        di.raw_item_name,
        di.unit,
        di.requested_qty,
        di.negotiated_qty,
        di.status,
        di.remarks
      FROM category_demands cd
      JOIN users u ON cd.category_user_id = u.id
      LEFT JOIN demand_items di ON di.demand_id = cd.id
    `;

    const params = [];

    if (role === "CATEGORY") {
      query += " WHERE cd.category_user_id = ?";
      params.push(userId);
    }

    query += " ORDER BY cd.created_at DESC";

    const [rows] = await pool.execute(query, params);

    const grouped = {};

    rows.forEach(row => {
      if (!grouped[row.demand_id]) {
        grouped[row.demand_id] = {
          demand_id: row.demand_id,
          category_name: row.category_name,
          created_at: row.created_at,
          items: [],
        };
      }

      if (row.item_id) {
        grouped[row.demand_id].items.push({
          id: row.item_id,
          raw_item_name: row.raw_item_name,
          unit: row.unit,
          requested_qty: row.requested_qty,
          negotiated_qty: row.negotiated_qty,
          status: row.status,
          remarks: row.remarks,
        });
      }
    });

    return res.json(Object.values(grouped));

  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};
exports.getMyDeliveries = async (req, res) => {
  try {
    // only CATEGORY can access
    if (req.user.role !== "CATEGORY") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT
        di.id AS demand_item_id,
        di.raw_item_name,
        di.unit,
        di.requested_qty,
        di.negotiated_qty,

        COALESCE(SUM(d.delivered_qty),0) AS delivered_qty

      FROM category_demands cd
      JOIN demand_items di
        ON di.demand_id = cd.id
      LEFT JOIN demand_inventory_mapping dm
        ON dm.demand_item_id = di.id
      LEFT JOIN deliveries d
        ON d.mapping_id = dm.id

      WHERE cd.category_user_id = ?
        AND di.status = 'APPROVED'

      GROUP BY di.id`,
      [userId]
    );

    const result = rows.map(r => {
      const approvedQty = r.negotiated_qty ?? r.requested_qty;
      return {
      demand_item_id: r.demand_item_id,
      item_name: r.raw_item_name,
      unit: r.unit,

      negotiated_qty: r.negotiated_qty,
      approved_qty: approvedQty,
      delivered_qty: r.delivered_qty,
      pending: approvedQty - r.delivered_qty,
    };
    });

    return res.json(result);

  } catch (err) {
    return res.status(500).json({
      message: "Database error",
    });
  }
};

exports.deleteDemandItem = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({ message: "Access denied" });
    }

    const itemId = req.params.id;

    // Check if it's mapped to any inventory
    const [mappings] = await pool.execute(
      "SELECT id FROM demand_inventory_mapping WHERE demand_item_id = ?",
      [itemId]
    );

    if (mappings.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete item because it has been mapped to inventory."
      });
    }

    await pool.execute("DELETE FROM demand_items WHERE id = ?", [itemId]);

    return res.json({ message: "Demand item deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Database error" });
  }
};

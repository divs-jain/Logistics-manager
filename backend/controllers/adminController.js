const pool = require("../config/db");

// Supply vs demand per inventory SKU. Demand is the quantity mapped to this SKU
// (not the whole demand line, which may be split across SKUs), and deliveries are
// pre-aggregated per mapping so multiple deliveries don't multiply the demand.
async function fetchInventoryAnalysis() {
  const [rows] = await pool.execute(`
    SELECT
      ii.id,
      ii.name,
      ii.unit,
      ii.quantity AS total_inventory,

      COALESCE(SUM(CASE WHEN di.status = 'APPROVED' THEN dm.issued_qty END),0) AS total_demand,
      COALESCE(SUM(dd.delivered_qty),0) AS delivered

    FROM inventory_items ii
    LEFT JOIN demand_inventory_mapping dm
      ON dm.inventory_item_id = ii.id
    LEFT JOIN demand_items di
      ON di.id = dm.demand_item_id
    LEFT JOIN (
      SELECT mapping_id, SUM(delivered_qty) AS delivered_qty
      FROM deliveries
      GROUP BY mapping_id
    ) dd
      ON dd.mapping_id = dm.id

    GROUP BY ii.id
  `);

  return rows.map(r => {
    const totalDemand = Number(r.total_demand);
    const delivered = Number(r.delivered);
    const pending = totalDemand - delivered;
    const status = r.total_inventory - pending; // S / D logic

    return {
      id: r.id,
      item_name: r.name,
      unit: r.unit,
      total_inventory: r.total_inventory,
      total_demand: totalDemand,
      delivered,
      status,
    };
  });
}

function csvField(value) {
  const str = String(value ?? "");
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

exports.updateDemandItem = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const demandItemId = req.params.id;
  const { negotiated_qty, remarks, status } = req.body;

  const allowedStatus = ["UNDER_REVIEW", "APPROVED", "REJECTED"];

  if (status && !allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Get demand item
    const [rows] = await connection.execute(
      `SELECT requested_qty
       FROM demand_items
       WHERE id = ?
       FOR UPDATE`,
      [demandItemId]
    );

    if (rows.length === 0) {
      throw new Error("Demand item not found");
    }

    const requestedQty = rows[0].requested_qty;

    // 2️⃣ Check if mapping exists
    const [mappingRows] = await connection.execute(
      `SELECT COUNT(*) as count
       FROM demand_inventory_mapping
       WHERE demand_item_id = ?`,
      [demandItemId]
    );

    if (mappingRows[0].count > 0) {
      throw new Error(
        "Cannot edit negotiation after mapping exists. Delete mapping first."
      );
    }

    // 3️⃣ Validate negotiated bounds (optional field)
    if (negotiated_qty !== undefined && negotiated_qty !== null) {
      if (negotiated_qty < 0) {
        throw new Error("negotiated_qty cannot be negative");
      }

      // (Check removed per user request: negotiated_qty can exceed requested_qty)
    }

    await connection.execute(
      `UPDATE demand_items
       SET negotiated_qty = ?, remarks = ?, status = ?
       WHERE id = ?`,
      [
        negotiated_qty ?? null,
        remarks ?? null,
        status ?? "UNDER_REVIEW",
        demandItemId,
      ]
    );

    await connection.commit();
    connection.release();

    return res.json({ message: "Demand item updated" });

  } catch (err) {
    await connection.rollback();
    connection.release();
    return res.status(400).json({ message: err.message });
  }
};

exports.createOrUpdateMapping = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { demand_item_id, inventory_item_id, issued_qty } = req.body;

  if (!demand_item_id || !inventory_item_id || !issued_qty) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (issued_qty <= 0) {
    return res.status(400).json({
      message: "issued_qty must be greater than zero",
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Lock demand item
    const [demandRows] = await connection.execute(
      `SELECT negotiated_qty, requested_qty, status
       FROM demand_items
       WHERE id = ?
       FOR UPDATE`,
      [demand_item_id]
    );

    if (demandRows.length === 0) {
      throw new Error("Demand item not found");
    }

    const demandItem = demandRows[0];

    if (demandItem.status !== "APPROVED") {
      throw new Error("Mapping allowed only for APPROVED items");
    }

    // Cap total mapped qty: use negotiated_qty if set, else requested_qty
    const maxMappableQty =
      demandItem.negotiated_qty ?? demandItem.requested_qty;

    // 2️⃣ Get current total mapped (excluding current inventory item if exists)
    const [mappedRows] = await connection.execute(
      `SELECT COALESCE(SUM(issued_qty),0) as total_mapped
       FROM demand_inventory_mapping
       WHERE demand_item_id = ?`,
      [demand_item_id]
    );

    const totalMapped = mappedRows[0].total_mapped;

    // Check if this mapping already exists
    const [existingRows] = await connection.execute(
      `SELECT id, issued_qty
       FROM demand_inventory_mapping
       WHERE demand_item_id = ? AND inventory_item_id = ?`,
      [demand_item_id, inventory_item_id]
    );

    let adjustedTotal = totalMapped;

    if (existingRows.length > 0) {
      // subtract old value before adding new
      adjustedTotal = totalMapped - existingRows[0].issued_qty;
    }

    // Removed: The user requested the ability to map exceeding quantities.
    // if (adjustedTotal + issued_qty > maxMappableQty) {
    //   throw new Error("Total mapped exceeds allowed quantity");
    // }

    if (existingRows.length > 0) {
      await connection.execute(
        `UPDATE demand_inventory_mapping
         SET issued_qty = ?
         WHERE id = ?`,
        [issued_qty, existingRows[0].id]
      );
    } else {
      await connection.execute(
        `INSERT INTO demand_inventory_mapping
         (demand_item_id, inventory_item_id, issued_qty, mapped_by)
         VALUES (?, ?, ?, ?)`,
        [demand_item_id, inventory_item_id, issued_qty, req.user.id]
      );
    }

    await connection.commit();
    connection.release();

    return res.json({ message: "Mapping saved" });

  } catch (err) {
    await connection.rollback();
    connection.release();
    return res.status(400).json({ message: err.message });
  }
};

exports.getDeliveryDashboard = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const categoryUserId = req.params.categoryUserId;

    const [rows] = await pool.execute(
      `SELECT
        di.id AS demand_item_id,

        dm.id AS mapping_id,
        dm.issued_qty AS mapped_qty,

        ii.name AS inventory_name,
        ii.unit,
        ii.location,
        ii.quantity AS inventory_available,

        COALESCE(SUM(d.delivered_qty),0) AS delivered_qty

      FROM category_demands cd
      JOIN demand_items di
        ON di.demand_id = cd.id
      JOIN demand_inventory_mapping dm
        ON dm.demand_item_id = di.id
      JOIN inventory_items ii
        ON ii.id = dm.inventory_item_id
      LEFT JOIN deliveries d
        ON d.mapping_id = dm.id

      WHERE cd.category_user_id = ?
      GROUP BY dm.id`,
      [categoryUserId]
    );


    const result = rows.map(r => ({
      demand_item_id: r.demand_item_id,
      mapping_id: r.mapping_id,

      item_name: r.inventory_name,
      unit: r.unit,
      location: r.location,

      mapped_qty: r.mapped_qty,          // Total Demand
      delivered_qty: r.delivered_qty,
      to_deliver: r.mapped_qty - r.delivered_qty,

      inventory_available: r.inventory_available,
    }));


    return res.json(result);

  } catch (err) {
    return res.status(500).json({
      message: "Database error",
    });
  }
};

exports.getDeliveryHistory = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({ message: "Access denied" });
    }

    const categoryUserId = req.params.categoryUserId;

    const [rows] = await pool.execute(
      `SELECT
        dl.id AS log_id,
        dl.receiver_name,
        dl.delivered_at,
        u.email AS delivered_by_email,
        d.id AS delivery_id,
        d.delivered_qty,
        ii.name AS inventory_name,
        di.raw_item_name AS demand_name
      FROM delivery_logs dl
      JOIN users u ON dl.delivered_by = u.id
      JOIN deliveries d ON d.delivery_log_id = dl.id
      JOIN demand_inventory_mapping dm ON d.mapping_id = dm.id
      JOIN inventory_items ii ON dm.inventory_item_id = ii.id
      JOIN demand_items di ON dm.demand_item_id = di.id
      WHERE dl.category_user_id = ?
      ORDER BY dl.delivered_at DESC`,
      [categoryUserId]
    );

    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.log_id]) {
        grouped[r.log_id] = {
          id: r.log_id,
          receiver_name: r.receiver_name,
          delivered_at: r.delivered_at,
          delivered_by: r.delivered_by_email,
          items: []
        };
      }
      grouped[r.log_id].items.push({
        delivery_id: r.delivery_id,
        delivered_qty: r.delivered_qty,
        inventory_name: r.inventory_name,
        demand_name: r.demand_name
      });
    }

    return res.json(Object.values(grouped));
  } catch (err) {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.recordDeliveryBatch = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { category_user_id, receiver_name, items } = req.body;
  
  if (!category_user_id || !receiver_name || !items || !items.length) {
    return res.status(400).json({ message: "Invalid input. Category, receiver, and items are required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Create Delivery Log
    const [logResult] = await connection.execute(
      `INSERT INTO delivery_logs (category_user_id, delivered_by, receiver_name, delivered_at)
       VALUES (?, ?, ?, NOW())`,
      [category_user_id, req.user.id, receiver_name]
    );
    const deliveryLogId = logResult.insertId;

    // 2️⃣ Process each item
    for (const item of items) {
      const { mapping_id, delivered_qty } = item;
      
      if (!mapping_id || !delivered_qty || delivered_qty <= 0) continue;
      
      // Lock mapping row
      const [mappingRows] = await connection.execute(
        `SELECT issued_qty, inventory_item_id FROM demand_inventory_mapping WHERE id = ? FOR UPDATE`,
        [mapping_id]
      );
      if (mappingRows.length === 0) throw new Error(`Mapping ${mapping_id} not found`);
      const mapping = mappingRows[0];

      // Lock inventory row
      const [inventoryRows] = await connection.execute(
        `SELECT quantity FROM inventory_items WHERE id = ? FOR UPDATE`,
        [mapping.inventory_item_id]
      );
      const inventory = inventoryRows[0];

      // Re-calculate remaining mapped
      const [deliverySumRows] = await connection.execute(
        `SELECT COALESCE(SUM(delivered_qty), 0) AS total_delivered FROM deliveries WHERE mapping_id = ?`,
        [mapping_id]
      );
      const totalDelivered = deliverySumRows[0].total_delivered;
      const remainingToDeliver = mapping.issued_qty - totalDelivered;

      if (delivered_qty > remainingToDeliver) throw new Error("Exceeds remaining mapped quantity for an item");
      if (delivered_qty > inventory.quantity) throw new Error("Insufficient inventory for an item");

      // Insert delivery with log ID
      await connection.execute(
        `INSERT INTO deliveries (mapping_id, delivered_qty, delivered_by, delivered_at, delivery_log_id)
         VALUES (?, ?, ?, NOW(), ?)`,
        [mapping_id, delivered_qty, req.user.id, deliveryLogId]
      );

      // Update inventory
      const [updateResult] = await connection.execute(
        `UPDATE inventory_items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?`,
        [delivered_qty, mapping.inventory_item_id, delivered_qty]
      );
      if (updateResult.affectedRows === 0) throw new Error("Inventory update conflict");
    }

    await connection.commit();
    connection.release();
    return res.json({ message: "Delivery batch recorded successfully" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    return res.status(400).json({ message: err.message || "Delivery batch failed" });
  }
};
exports.getInventoryAnalysis = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.json(await fetchInventoryAnalysis());

  } catch (err) {
    return res.status(500).json({
      message: "Database error",
    });
  }
};

exports.getInventoryBreakdown = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const inventoryId = req.params.inventoryId;

    // inventory details
    const [invRows] = await pool.execute(
      `SELECT id, name, quantity, unit, location
       FROM inventory_items
       WHERE id = ?`,
      [inventoryId]
    );

    if (invRows.length === 0) {
      return res.status(404).json({
        message: "Inventory item not found",
      });
    }

    // mapped demand breakdown
    const [rows] = await pool.execute(`
      SELECT
        di.id AS demand_id,
        u.category_name,
        dm.issued_qty AS mapped_qty,
        COALESCE(SUM(d.delivered_qty),0) AS delivered_qty

      FROM demand_inventory_mapping dm
      JOIN demand_items di
        ON di.id = dm.demand_item_id
      JOIN category_demands cd
        ON cd.id = di.demand_id
      JOIN users u
        ON u.id = cd.category_user_id
      LEFT JOIN deliveries d
        ON d.mapping_id = dm.id

      WHERE dm.inventory_item_id = ?
      GROUP BY dm.id
    `, [inventoryId]);

    return res.json({
      inventory: invRows[0],
      demands: rows,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Database error",
    });
  }
};

exports.exportInventoryAnalysisCSV = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const rows = await fetchInventoryAnalysis();

    // csv header
    let csv =
      "ID,Item Name,Unit,Total Inventory,Total Demand,Delivered,Status\n";

    rows.forEach(r => {
      csv += [r.id, r.item_name, r.unit, r.total_inventory, r.total_demand, r.delivered, r.status]
        .map(csvField)
        .join(",") + "\n";
    });

    // file response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=procurement_analysis.csv"
    );

    return res.send(csv);

  } catch (err) {
    return res.status(500).json({
      message: "Database error",
    });
  }
};

exports.getCategoryUsers = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({ message: "Access denied" });
    }

    const [rows] = await pool.execute(
      `SELECT id, email, category_name
       FROM users
       WHERE role = 'CATEGORY' AND is_active = 1
       ORDER BY category_name`
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.getDemandItemMappings = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({ message: "Access denied" });
    }

    const demandItemId = req.params.demandItemId;

    const [rows] = await pool.execute(
      `SELECT
        dm.id,
        dm.demand_item_id,
        dm.inventory_item_id,
        dm.issued_qty,
        ii.name AS inventory_name,
        ii.unit,
        ii.location,
        ii.quantity AS inventory_available
       FROM demand_inventory_mapping dm
       JOIN inventory_items ii ON ii.id = dm.inventory_item_id
       WHERE dm.demand_item_id = ?
       ORDER BY ii.name`,
      [demandItemId]
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.getAllMappings = async (req, res) => {
  try {
    if (req.user.role !== "CC") {
      return res.status(403).json({ message: "Access denied" });
    }

    const [rows] = await pool.execute(
      `SELECT
        dm.id,
        dm.demand_item_id,
        dm.inventory_item_id,
        dm.issued_qty,
        ii.name AS inventory_name,
        ii.unit,
        ii.location,
        ii.quantity AS inventory_available
       FROM demand_inventory_mapping dm
       JOIN inventory_items ii ON ii.id = dm.inventory_item_id
       ORDER BY ii.name`
    );

    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
};

exports.deleteMapping = async (req, res) => {
  if (req.user.role !== "CC") {
    return res.status(403).json({ message: "Access denied" });
  }

  const mappingId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1️⃣ Lock mapping and check if any deliveries exist for it
    const [deliveries] = await connection.execute(
      "SELECT id FROM deliveries WHERE mapping_id = ?",
      [mappingId]
    );

    if (deliveries.length > 0) {
      throw new Error("Cannot delete mapping: deliveries have already been recorded against it");
    }

    // 2️⃣ Delete mapping
    const [result] = await connection.execute(
      "DELETE FROM demand_inventory_mapping WHERE id = ?",
      [mappingId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Mapping not found");
    }

    await connection.commit();
    connection.release();

    return res.json({ message: "Mapping deleted successfully" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    return res.status(400).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let stats = {};

    const [invRows] = await pool.execute("SELECT COUNT(id) as count FROM inventory_items");
    stats.inventoryItems = invRows[0].count;

    if (role === "CC" || role === "OC") {
      const [demandRows] = await pool.execute("SELECT COUNT(id) as count FROM demand_items");
      stats.totalItems = demandRows[0].count;
      
      const [reviewRows] = await pool.execute("SELECT COUNT(id) as count FROM demand_items WHERE status = 'UNDER_REVIEW'");
      stats.demandBatches = reviewRows[0].count;
      
      const [mapRows] = await pool.execute("SELECT COUNT(id) as count FROM demand_inventory_mapping");
      stats.pendingDeliveries = mapRows[0].count; // Simplified representation
    } else {
      const [demandRows] = await pool.execute(
        "SELECT COUNT(d.id) as count FROM demand_items d JOIN category_demands c ON d.demand_id = c.id WHERE c.category_user_id = ?",
        [userId]
      );
      stats.totalItems = demandRows[0].count;
      
      const [mapRows] = await pool.execute(
        "SELECT COUNT(m.id) as count FROM demand_inventory_mapping m JOIN demand_items d ON m.demand_item_id = d.id JOIN category_demands c ON d.demand_id = c.id WHERE c.category_user_id = ?",
        [userId]
      );
      stats.pendingDeliveries = mapRows[0].count;
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

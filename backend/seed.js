const bcrypt = require("bcryptjs");
const pool = require("./config/db");
require("dotenv").config();

const DEMO_PASSWORD = "password123";

const users = [
  { email: "cc@logistics.com", role: "CC", category_name: null },
  { email: "oc@logistics.com", role: "OC", category_name: null },
  { email: "arts@logistics.com", role: "CATEGORY", category_name: "Arts" },
  { email: "sports@logistics.com", role: "CATEGORY", category_name: "Sports" },
];

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const user of users) {
    await pool.execute(
      `INSERT INTO users (email, password_hash, role, category_name, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         category_name = VALUES(category_name),
         is_active = 1`,
      [user.email, hash, user.role, user.category_name]
    );
    console.log(`Seeded: ${user.email} (${user.role})`);
  }

  const sampleInventory = [
    ["White Paint", "100ml", 10, "Warehouse A"],
    ["White Paint", "50ml", 20, "Warehouse A"],
    ["White Paint", "25ml", 40, "Warehouse B"],
    ["Blue Paint", "25ml", 30, "Warehouse B"],
    ["Canvas Sheet", "pc", 100, "Warehouse C"],
  ];

  for (const [name, unit, quantity, location] of sampleInventory) {
    const [existing] = await pool.execute(
      "SELECT id FROM inventory_items WHERE LOWER(name)=LOWER(?) AND unit=?",
      [name, unit]
    );
    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO inventory_items (name, unit, quantity, location)
         VALUES (?, ?, ?, ?)`,
        [name, unit, quantity, location]
      );
    }
  }

  console.log("\nDemo password for all users:", DEMO_PASSWORD);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

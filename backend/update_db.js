require("dotenv").config();
const pool = require("./config/db");

async function update() {
  try {
    console.log("Creating app_settings table...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255)
      )
    `);

    // Insert default value
    await pool.execute(`
      INSERT IGNORE INTO app_settings (setting_key, setting_value)
      VALUES ('block_demands', 'false')
    `);

    console.log("Creating delivery_logs table...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS delivery_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_user_id INT NOT NULL,
        delivered_by INT NOT NULL,
        receiver_name VARCHAR(255) NOT NULL,
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_user_id) REFERENCES users(id),
        FOREIGN KEY (delivered_by) REFERENCES users(id)
      )
    `);

    console.log("Altering deliveries table...");
    // Only alter if the column doesn't exist. It's safer to just run ALTER and catch error if it already exists, or check first.
    try {
      await pool.execute(`ALTER TABLE deliveries ADD COLUMN delivery_log_id INT DEFAULT NULL`);
      await pool.execute(`ALTER TABLE deliveries ADD FOREIGN KEY (delivery_log_id) REFERENCES delivery_logs(id) ON DELETE CASCADE`);
      console.log("Added delivery_log_id to deliveries table.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("delivery_log_id already exists in deliveries table.");
      } else {
        throw e;
      }
    }

    console.log("Database update complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

update();

-- Logistics database schema
-- Run: mysql -u root -p < schema.sql  (or import via MySQL Workbench)

CREATE DATABASE IF NOT EXISTS logistics_db;
USE logistics_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CC', 'OC', 'CATEGORY') NOT NULL,
  block_demands TINYINT(1) DEFAULT 0,
  category_name VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  location VARCHAR(255) DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS category_demands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_user_id INT NOT NULL,
  imported_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_user_id) REFERENCES users(id),
  FOREIGN KEY (imported_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS demand_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demand_id INT NOT NULL,
  raw_item_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  requested_qty INT NOT NULL,
  negotiated_qty INT DEFAULT NULL,
  status ENUM('UNDER_REVIEW', 'APPROVED', 'REJECTED') DEFAULT 'UNDER_REVIEW',
  remarks TEXT DEFAULT NULL,
  FOREIGN KEY (demand_id) REFERENCES category_demands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS demand_inventory_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demand_item_id INT NOT NULL,
  inventory_item_id INT NOT NULL,
  issued_qty INT NOT NULL,
  mapped_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demand_item_id) REFERENCES demand_items(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (mapped_by) REFERENCES users(id),
  UNIQUE KEY unique_demand_inventory (demand_item_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS delivery_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_user_id INT NOT NULL,
  delivered_by INT NOT NULL,
  receiver_name VARCHAR(255) NOT NULL,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_user_id) REFERENCES users(id),
  FOREIGN KEY (delivered_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mapping_id INT NOT NULL,
  delivered_qty INT NOT NULL,
  delivered_by INT NOT NULL,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_log_id INT DEFAULT NULL,
  FOREIGN KEY (mapping_id) REFERENCES demand_inventory_mapping(id),
  FOREIGN KEY (delivered_by) REFERENCES users(id),
  FOREIGN KEY (delivery_log_id) REFERENCES delivery_logs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255)
);

INSERT IGNORE INTO app_settings (setting_key, setting_value)
VALUES ('block_demands', 'false');

-- Demo users: run `node seed.js` after schema import to create users with password "password123"

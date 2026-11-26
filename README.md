# Logistics - Inventory Management System

A comprehensive, role-based procurement and inventory management system built to handle category demands, negotiations, multi-sku mapping, real-time deliveries, and surplus/deficit analysis. 

## Features
- **Role-Based Access Control (RBAC):** Three distinct roles—Central Coordinator (CC), Operations Coordinator (OC), and Category Managers.
- **Dynamic Dashboard:** Real-time metrics based on the logged-in user's role.
- **Inventory Management:** Full CRUD capabilities for warehouse stock items.
- **Demand Requests & Negotiations:** Categories can request items. CCs can review, approve, or negotiate requested quantities.
- **Category Demand Locks:** Granular control allowing admins (CCs) to selectively block individual categories from making further demands once deadlines pass.
- **Complex Mapping:** Map a single demand line item to multiple distinct physical inventory SKUs (e.g., fulfilling a generic "Pens" request using both "Blue Pens" and "Black Pens").
- **Delivery Ledger:** Track delivered vs. mapped quantities in real-time.
- **Analysis Engine:** Instantly compute supply versus demand ledgers to identify item deficits and surpluses.
- **Automated Snapshots:** Fully automated, self-pruning MySQL database backups scheduled every 4 hours.

---

## 🚀 Step-by-Step Setup Guide

If you are running this project on a new PC, follow these steps exactly.

### Prerequisites
- **Node.js** (v18 or higher)
- **MySQL** (v8 or higher) running locally on your machine.

### 1. Database Initialization
First, you need to create the database structure.
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Import the schema into your MySQL instance:
   ```bash
   mysql -u root -p < schema.sql
   ```
   *(This creates a database named `logistics_db` and builds all the necessary tables).*

   > **Upgrading an older install?** If your database was created from an earlier version of `schema.sql`, run `node update_db.js` once from the `backend` folder to add the `app_settings` and `delivery_logs` tables.

### 2. Configure Environment Variables
Inside the `backend/` folder, ensure you have a `.env` file (or rename `.env.example` to `.env`) with your actual MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=logistics_db
JWT_SECRET=some_very_secure_random_string
PORT=4000
```

### 3. Demo / Test Data Seeding (Optional)
If you want to test the application with dummy accounts and sample inventory, run the seeder script.
1. Make sure you are in the `backend` directory.
2. Install dependencies and run the seed script:
   ```bash
   npm install
   npm run seed
   ```
This generates the following accounts (All passwords are **`password123`**):
- **CC User:** `cc@logistics.com`
- **OC User:** `oc@logistics.com`
- **Category User (Arts):** `arts@logistics.com`
- **Category User (Sports):** `sports@logistics.com`

---

## 🏃‍♂️ Running the Application

You need two separate terminal windows running simultaneously—one for the Backend API and one for the Frontend UI.

### 1. Start the Backend (API Server & Backup Scheduler)
Open Terminal 1:
```bash
cd backend
npm install
npm start
```
*The backend server is now running on **http://localhost:4000**.*

### 2. Start the Frontend (User Interface)
Open Terminal 2:
```bash
cd frontend
npm install
npm run dev
```
*The frontend is now running on **http://localhost:5173**.*

**Open your browser and navigate to `http://localhost:5173` to start using the system.**

---

## 🛡️ Automated Database Backups (Snapshots)
Data integrity is critical. This application has a built-in automated backup system.

**How it works:**
- Every **4 hours**, the backend Node.js server automatically triggers a bash script (`backend/backup.sh`).
- This script takes a full `mysqldump` snapshot of your database and saves it into the `/backend/backups/` directory.
- The filenames contain exact timestamps (e.g., `backup_2026-07-03_11-37-12.sql`).
- To prevent your hard drive from filling up, the script automatically deletes old backups, keeping only the 10 most recent snapshots.

**How to restore a snapshot:**
If the site crashes or data is accidentally deleted, you can easily "undo" the damage by restoring a snapshot.
1. Find the backup file you want to restore in the `/backend/backups/` folder.
2. Open your terminal and run:
   ```bash
   mysql -u root -p logistics_db < /path/to/inventory/backend/backups/backup_2026-07-03_11-37-12.sql
   ```
3. Enter your MySQL password. The database is instantly reverted to that exact timestamp.

---

## 🏗️ Technology Stack
- **Frontend:** React, Vite, React Router, TailwindCSS, Lucide-React, Shadcn UI paradigms.
- **Backend:** Node.js, Express.js.
- **Database:** MySQL (relational, ACID-compliant transactions).
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` for secure API routes, parameterized SQL queries preventing SQL Injection.
- **Automation:** `node-cron` for scheduled background tasks.

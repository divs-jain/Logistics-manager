const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const categoryRoutes = require("./routes/categories");
const adminRoutes = require("./routes/admin");
const usersRoutes = require("./routes/users");
const settingsRoutes = require("./routes/settings");
const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");

const helmet = require("helmet");
const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/auth", authRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/categories", categoryRoutes);
app.use("/admin", adminRoutes);
app.use("/users", usersRoutes);
app.use("/settings", settingsRoutes);


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Schedule automatic database backups every 4 hours
  cron.schedule("0 */4 * * *", () => {
    console.log("[Backup] Starting scheduled database backup...");
    const scriptPath = path.join(__dirname, "backup.sh");
    
    exec(`"${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Backup Error] ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[Backup Stderr] ${stderr}`);
      }
      console.log(`[Backup Success] ${stdout.trim()}`);
    });
  });
  console.log("Database backup scheduled (runs every 4 hours).");
});
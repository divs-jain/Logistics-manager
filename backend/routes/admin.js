const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Dashboard Stats
router.get(
  "/dashboard",
  authMiddleware,
  adminController.getDashboardStats
);

// Update demand item (negotiation)
router.put(
  "/demand-items/:id",
  authMiddleware,
  adminController.updateDemandItem
);
// Create or update mapping (draft)
router.post(
  "/mapping",
  authMiddleware,
  adminController.createOrUpdateMapping
);
// Delivery dashboard for a category
router.get(
  "/deliveries/:categoryUserId",
  authMiddleware,
  adminController.getDeliveryDashboard
);

router.post(
  "/deliveries/batch",
  authMiddleware,
  adminController.recordDeliveryBatch
);
// Get delivery history for category
router.get(
  "/deliveries/:categoryUserId/history",
  authMiddleware,
  adminController.getDeliveryHistory
);
// Procurement analysis summary
router.get(
  "/analysis/inventory",
  authMiddleware,
  adminController.getInventoryAnalysis
);
// export procurement analysis
router.get(
  "/analysis/inventory/export",
  authMiddleware,
  adminController.exportInventoryAnalysisCSV
);
// Demand breakdown modal
router.get(
  "/analysis/inventory/:inventoryId",
  authMiddleware,
  adminController.getInventoryBreakdown
);
// Category users for dropdowns
router.get(
  "/category-users",
  authMiddleware,
  adminController.getCategoryUsers
);
// Mappings for a demand item
router.get(
  "/mappings/:demandItemId",
  authMiddleware,
  adminController.getDemandItemMappings
);

// All mappings
router.get(
  "/mappings",
  authMiddleware,
  adminController.getAllMappings
);

// Delete mapping (CC only)
router.delete(
  "/mappings/:id",
  authMiddleware,
  adminController.deleteMapping
);

module.exports = router;

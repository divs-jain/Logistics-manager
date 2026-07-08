const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const categoryController = require("../controllers/categoryController");

// Create demand batch (CC only)
router.post(
  "/demands",
  authMiddleware,
  categoryController.createDemandBatch
);
// Add demand item to a batch (CC only)
router.post(
  "/demands/:demandId/items",
  authMiddleware,
  categoryController.addDemandItem
);
// View demands (CC and CATEGORY)
router.get(
  "/demands",
  authMiddleware,
  categoryController.getDemands
);
// CATEGORY delivery visibility
router.get(
  "/my-deliveries",
  authMiddleware,
  categoryController.getMyDeliveries
);

// Delete demand item (CC only)
router.delete(
  "/demands/items/:id",
  authMiddleware,
  categoryController.deleteDemandItem
);

module.exports = router;

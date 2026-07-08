const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const inventoryController = require("../controllers/inventoryController");

// Role check middleware
const inventoryAccess = (req, res, next) => {
  if (req.user.role !== "CC" && req.user.role !== "OC") {
    return res.status(403).json({
      message: "Access denied",
    });
  }
  next();
};

// GET inventory list
router.get(
  "/",
  authMiddleware,
  inventoryAccess,
  inventoryController.getInventory
);

// ADD inventory item
router.post(
  "/",
  authMiddleware,
  inventoryAccess,
  inventoryController.addInventoryItem
);

// UPDATE inventory quantity
router.put(
  "/:id",
  authMiddleware,
  inventoryAccess,
  inventoryController.updateInventoryQuantity
);

// UPDATE inventory details (name, unit, location)
router.put(
  "/details/:id",
  authMiddleware,
  inventoryAccess,
  inventoryController.updateInventoryDetails
);

// DELETE inventory item
router.delete(
  "/:id",
  authMiddleware,
  inventoryAccess,
  inventoryController.deleteInventoryItem
);

module.exports = router;

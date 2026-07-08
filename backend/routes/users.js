const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// All user routes require authentication (and CC role is checked in controller)
router.use(authMiddleware);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.delete("/:id", userController.deleteUser);
router.put("/:id/block-demands", userController.toggleBlockDemands);

module.exports = router;

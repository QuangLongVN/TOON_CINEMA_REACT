const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authController.getMe);
router.patch("/users/:id/role", requireAuth, requireAdmin, authController.updateUserRole);

module.exports = router;
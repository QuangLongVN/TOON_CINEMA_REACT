const express = require("express");
const router = express.Router();
const controller = require("../controllers/ticketController");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);
router.post("/", controller.createTicket);
router.get("/mine", controller.getMyTickets);
router.get("/check/:code", controller.checkMyTicket);

module.exports = router;

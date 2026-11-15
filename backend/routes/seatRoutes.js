const express = require("express");
const router = express.Router();
const controller = require("../controllers/seatController");

router.get("/:showtimeId", controller.getBookedSeats);
router.post("/book", controller.bookSeat);
router.delete("/:id", controller.cancelSeat);

module.exports = router;
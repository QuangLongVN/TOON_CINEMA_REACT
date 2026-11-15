const express = require("express");
const router = express.Router();
const controller = require("../controllers/showtimeController");

router.get("/", controller.getShowtimes);
router.get("/:id", controller.getShowtimeById);
router.post("/", controller.createShowtime);
router.put("/:id", controller.updateShowtime);
router.delete("/:id", controller.deleteShowtime);

module.exports = router;
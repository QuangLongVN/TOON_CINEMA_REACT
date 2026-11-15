const express = require("express");
const router = express.Router();

const movieController = require("../controllers/movieController");
const upload = require("../middleware/upload");

router.get("/", movieController.getAll);

router.get("/:id", movieController.getById);

router.post(
    "/",
    upload.single("poster"),
    movieController.create
);

router.put(
    "/:id",
    upload.single("poster"),
    movieController.update
);

router.delete("/:id", movieController.delete);

module.exports = router;
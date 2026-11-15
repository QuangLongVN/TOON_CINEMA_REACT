const express = require("express");
const multer = require("multer");

const movieController = require("../controllers/movieController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ hỗ trợ ảnh JPG, PNG, WEBP"));
        }
    }
});

// Lấy danh sách phim
router.get("/", movieController.getAllMovies);

// Lấy chi tiết phim
router.get("/:id", movieController.getMovieById);

// Thêm phim và tải poster
router.post(
    "/",
    upload.single("poster"),
    movieController.createMovie
);

// Sửa phim và thay poster
router.put(
    "/:id",
    upload.single("poster"),
    movieController.updateMovie
);

// Xóa phim
router.delete("/:id", movieController.deleteMovie);

module.exports = router;
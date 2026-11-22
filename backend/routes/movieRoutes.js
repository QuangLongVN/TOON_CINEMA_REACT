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
            cb(new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP"));
        }
    }
});

const uploadPoster = (req, res, next) => {
    upload.single("poster")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        next();
    });
};

// Lấy danh sách phim
router.get("/", movieController.getAllMovies);

// Lấy chi tiết phim
router.get("/:id", movieController.getMovieById);

// Thêm phim
router.post("/", uploadPoster, movieController.createMovie);

// Sửa phim
router.put("/:id", uploadPoster, movieController.updateMovie);

// Xóa phim
router.delete("/:id", movieController.deleteMovie);

module.exports = router;
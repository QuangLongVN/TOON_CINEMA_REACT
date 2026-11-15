const db = require("../config/db");
const cloudinary = require("../config/cloudinary");

// Upload ảnh lên Cloudinary
const uploadPoster = async (file) => {
    if (!file) return null;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "toon_cinema/posters",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
};

// LẤY DANH SÁCH PHIM
exports.getAllMovies = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM movies ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách phim:", error);

        res.status(500).json({
            message: "Không thể lấy danh sách phim"
        });
    }
};

// LẤY CHI TIẾT PHIM
exports.getMovieById = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM movies WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Lỗi lấy chi tiết phim:", error);

        res.status(500).json({
            message: "Không thể lấy thông tin phim"
        });
    }
};

// THÊM PHIM
exports.createMovie = async (req, res) => {
    try {
        const {
            title,
            genre,
            duration,
            status
        } = req.body || {};

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phim"
            });
        }

        let poster = null;

        if (req.file) {
            poster = await uploadPoster(req.file);
        }

        const [result] = await db.query(
            `INSERT INTO movies
             (title, genre, duration, poster, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                title.trim(),
                genre || null,
                duration ? Number(duration) : null,
                poster,
                status || "Đang chiếu"
            ]
        );

        res.status(201).json({
            message: "Thêm phim thành công",
            id: result.insertId,
            poster
        });

    } catch (error) {
        console.error("Lỗi thêm phim:", error);

        res.status(500).json({
            message: "Không thể thêm phim",
            error: error.message
        });
    }
};

// CẬP NHẬT PHIM
exports.updateMovie = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            genre,
            duration,
            status
        } = req.body || {};

        const [rows] = await db.query(
            "SELECT * FROM movies WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        const oldMovie = rows[0];

        let poster = oldMovie.poster;

        if (req.file) {
            poster = await uploadPoster(req.file);
        }

        await db.query(
            `UPDATE movies
             SET title = ?,
                 genre = ?,
                 duration = ?,
                 poster = ?,
                 status = ?
             WHERE id = ?`,
            [
                title !== undefined ? title : oldMovie.title,
                genre !== undefined ? genre : oldMovie.genre,
                duration !== undefined
                    ? (duration ? Number(duration) : null)
                    : oldMovie.duration,
                poster,
                status !== undefined ? status : oldMovie.status,
                id
            ]
        );

        res.json({
            message: "Cập nhật phim thành công",
            poster
        });

    } catch (error) {
        console.error("Lỗi cập nhật phim:", error);

        res.status(500).json({
            message: "Không thể cập nhật phim",
            error: error.message
        });
    }
};

// XÓA PHIM
exports.deleteMovie = async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM movies WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        res.json({
            message: "Xóa phim thành công"
        });

    } catch (error) {
        console.error("Lỗi xóa phim:", error);

        res.status(500).json({
            message: "Không thể xóa phim",
            error: error.message
        });
    }
};
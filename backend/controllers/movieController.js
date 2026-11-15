const db = require("../config/db");

// Lấy danh sách phim
exports.getMovies = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM movies ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy danh sách phim"
        });
    }
};

// Lấy chi tiết phim
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
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy thông tin phim"
        });
    }
};

// Thêm phim
exports.createMovie = async (req, res) => {
    try {
        const {
            title,
            genre,
            duration,
            description,
            poster,
            status
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phim"
            });
        }

        const [result] = await db.query(
            `INSERT INTO movies
             (title, genre, duration, description, poster, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                genre || null,
                duration || null,
                description || null,
                poster || null,
                status || "Đang chiếu"
            ]
        );

        res.status(201).json({
            message: "Thêm phim thành công",
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi thêm phim"
        });
    }
};

// Sửa phim
exports.updateMovie = async (req, res) => {
    try {
        const {
            title,
            genre,
            duration,
            description,
            poster,
            status
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phim"
            });
        }

        const [result] = await db.query(
            `UPDATE movies
             SET title = ?,
                 genre = ?,
                 duration = ?,
                 description = ?,
                 poster = ?,
                 status = ?
             WHERE id = ?`,
            [
                title.trim(),
                genre || null,
                duration || null,
                description || null,
                poster || null,
                status || "Đang chiếu",
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        res.json({
            message: "Cập nhật phim thành công"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi cập nhật phim"
        });
    }
};

// Xóa phim
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
        console.error(error);
        res.status(500).json({
            message: "Lỗi xóa phim"
        });
    }
};
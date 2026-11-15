const db = require("../config/db");
const cloudinary = require("../config/cloudinary");

const uploadPoster = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "toon-cinema/posters",
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

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM movies ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Không thể tải danh sách phim"
        });
    }
};

exports.getById = async (req, res) => {
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
            message: "Không thể tải thông tin phim"
        });
    }
};

exports.create = async (req, res) => {
    try {
        const { title, genre, duration, status } = req.body;

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
                genre || "",
                duration || null,
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
        console.error(error);

        res.status(500).json({
            message: "Không thể thêm phim"
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, genre, duration, status } = req.body;

        const [rows] = await db.query(
            "SELECT * FROM movies WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phim"
            });
        }

        let poster = rows[0].poster;

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
                title.trim(),
                genre || "",
                duration || null,
                poster,
                status || "Đang chiếu",
                id
            ]
        );

        res.json({
            message: "Cập nhật phim thành công",
            poster
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Không thể cập nhật phim"
        });
    }
};

exports.delete = async (req, res) => {
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
            message: "Không thể xóa phim"
        });
    }
};
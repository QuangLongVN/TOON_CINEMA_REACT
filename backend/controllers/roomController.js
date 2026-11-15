const db = require("../config/db");

// LẤY DANH SÁCH PHÒNG
exports.getRooms = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM rooms ORDER BY id DESC"
        );

        res.json(rows);

    } catch (error) {
        console.error("Lỗi lấy danh sách phòng:", error);

        res.status(500).json({
            message: "Lỗi lấy danh sách phòng"
        });
    }
};

// LẤY CHI TIẾT PHÒNG
exports.getRoomById = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM rooms WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error("Lỗi lấy thông tin phòng:", error);

        res.status(500).json({
            message: "Lỗi lấy thông tin phòng"
        });
    }
};

// THÊM PHÒNG - MẶC ĐỊNH 80 GHẾ
exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phòng"
            });
        }

        const [result] = await db.query(
            "INSERT INTO rooms (name, total_seats) VALUES (?, ?)",
            [name.trim(), 80]
        );

        res.status(201).json({
            message: "Thêm phòng thành công",
            id: result.insertId,
            total_seats: 80
        });

    } catch (error) {
        console.error("Lỗi thêm phòng:", error);

        res.status(500).json({
            message: "Lỗi thêm phòng"
        });
    }
};

// SỬA PHÒNG - GIỮ 80 GHẾ
exports.updateRoom = async (req, res) => {
    try {
        const { name } = req.body || {};

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phòng"
            });
        }

        const [result] = await db.query(
            "UPDATE rooms SET name = ?, total_seats = 80 WHERE id = ?",
            [name.trim(), req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json({
            message: "Sửa phòng thành công",
            total_seats: 80
        });

    } catch (error) {
        console.error("Lỗi sửa phòng:", error);

        res.status(500).json({
            message: "Lỗi sửa phòng"
        });
    }
};

// XÓA PHÒNG
exports.deleteRoom = async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM rooms WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json({
            message: "Xóa phòng thành công"
        });

    } catch (error) {
        console.error("Lỗi xóa phòng:", error);

        res.status(500).json({
            message: "Lỗi xóa phòng"
        });
    }
};
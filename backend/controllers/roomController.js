const db = require("../config/db");

exports.getRooms = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM rooms ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy danh sách phòng"
        });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM rooms WHERE id=?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy thông tin phòng"
        });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { name, total_seats } = req.body;
        const seats = Number(total_seats);

        if (
            typeof name !== "string" ||
            !name.trim() ||
            !Number.isInteger(seats) ||
            seats <= 0
        ) {
            return res.status(400).json({
                message: "Tên phòng hoặc số ghế không hợp lệ"
            });
        }

        const [result] = await db.query(
            "INSERT INTO rooms (name,total_seats) VALUES (?,?)",
            [name.trim(), seats]
        );

        res.status(201).json({
            message: "Thêm phòng thành công",
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi thêm phòng"
        });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { name, total_seats } = req.body;
        const seats = Number(total_seats);

        if (
            typeof name !== "string" ||
            !name.trim() ||
            !Number.isInteger(seats) ||
            seats <= 0
        ) {
            return res.status(400).json({
                message: "Tên phòng hoặc số ghế không hợp lệ"
            });
        }

        const [result] = await db.query(
            "UPDATE rooms SET name=?,total_seats=? WHERE id=?",
            [name.trim(), seats, req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json({ message: "Sửa phòng thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi sửa phòng"
        });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM rooms WHERE id=?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json({ message: "Xóa phòng thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi xóa phòng"
        });
    }
};
const db = require("../config/db");

exports.getBookedSeats = async (req, res) => {
    try {
        const [showtimes] = await db.query(
            "SELECT id FROM showtimes WHERE id=?",
            [req.params.showtimeId]
        );

        if (!showtimes.length) {
            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        const [rows] = await db.query(
            `SELECT id, showtime_id, seat_number, booked_at
             FROM booked_seats
             WHERE showtime_id=?
             ORDER BY seat_number`,
            [req.params.showtimeId]
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy danh sách ghế"
        });
    }
};

exports.bookSeat = async (req, res) => {
    try {
        const { showtime_id, seat_number } = req.body;

        const showtimeId = Number(showtime_id);

        if (
            !Number.isInteger(showtimeId) ||
            showtimeId <= 0 ||
            typeof seat_number !== "string" ||
            !/^[A-Z]\d{1,3}$/.test(seat_number)
        ) {
            return res.status(400).json({
                message: "Thông tin ghế không hợp lệ"
            });
        }

        const [showtimes] = await db.query(
            `SELECT r.total_seats
             FROM showtimes s
             JOIN rooms r ON s.room_id=r.id
             WHERE s.id=?`,
            [showtimeId]
        );

        if (!showtimes.length) {
            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        const seat = seat_number;
        const rowIndex = seat.charCodeAt(0) - 65;
        const column = Number(seat.slice(1));
        const seatIndex = rowIndex * 10 + column;

        if (
            column < 1 ||
            column > 10 ||
            seatIndex > showtimes[0].total_seats
        ) {
            return res.status(400).json({
                message: "Ghế không tồn tại trong phòng"
            });
        }

        const [result] = await db.query(
            `INSERT INTO booked_seats
             (showtime_id,seat_number)
             VALUES (?,?)`,
            [showtimeId, seat]
        );

        res.status(201).json({
            message: "Đặt ghế thành công",
            id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Ghế đã được đặt"
            });
        }

        console.error(error);
        res.status(500).json({
            message: "Lỗi đặt ghế"
        });
    }
};

exports.cancelSeat = async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM booked_seats WHERE id=?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy ghế đã đặt"
            });
        }

        res.json({ message: "Hủy đặt ghế thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi hủy ghế"
        });
    }
};
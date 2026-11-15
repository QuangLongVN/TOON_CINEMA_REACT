const db = require("../config/db");

const showtimeQuery = `
    SELECT
        s.id,
        s.movie_id,
        s.room_id,
        s.start_time,
        s.price,
        m.title AS movie_title,
        r.name AS room_name
    FROM showtimes s
    JOIN movies m ON s.movie_id = m.id
    JOIN rooms r ON s.room_id = r.id
`;

function validateShowtime(body) {
    const movieId = Number(body.movie_id);
    const roomId = Number(body.room_id);
    const price = Number(body.price ?? 0);

    if (
        !Number.isInteger(movieId) ||
        movieId <= 0 ||
        !Number.isInteger(roomId) ||
        roomId <= 0 ||
        typeof body.start_time !== "string" ||
        !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(body.start_time) ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return null;
    }

    return {
        movieId,
        roomId,
        startTime: body.start_time.replace("T", " "),
        price
    };
}

exports.getShowtimes = async (req, res) => {
    try {
        const [rows] = await db.query(
            showtimeQuery + " ORDER BY s.start_time DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy suất chiếu"
        });
    }
};

exports.getShowtimeById = async (req, res) => {
    try {
        const [rows] = await db.query(
            showtimeQuery + " WHERE s.id=?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy suất chiếu"
        });
    }
};

exports.createShowtime = async (req, res) => {
    try {
        const data = validateShowtime(req.body);

        if (!data) {
            return res.status(400).json({
                message: "Thông tin suất chiếu không hợp lệ"
            });
        }

        const [result] = await db.query(
            `INSERT INTO showtimes
             (movie_id,room_id,start_time,price)
             VALUES (?,?,?,?)`,
            [
                data.movieId,
                data.roomId,
                data.startTime,
                data.price
            ]
        );

        res.status(201).json({
            message: "Thêm suất chiếu thành công",
            id: result.insertId
        });
    } catch (error) {
        console.error(error);

        res.status(
            error.code === "ER_NO_REFERENCED_ROW_2" ? 400 : 500
        ).json({
            message: "Không thể thêm suất chiếu. Kiểm tra phim và phòng."
        });
    }
};

exports.updateShowtime = async (req, res) => {
    try {
        const data = validateShowtime(req.body);

        if (!data) {
            return res.status(400).json({
                message: "Thông tin suất chiếu không hợp lệ"
            });
        }

        const [result] = await db.query(
            `UPDATE showtimes
             SET movie_id=?,room_id=?,start_time=?,price=?
             WHERE id=?`,
            [
                data.movieId,
                data.roomId,
                data.startTime,
                data.price,
                req.params.id
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        res.json({ message: "Sửa suất chiếu thành công" });
    } catch (error) {
        console.error(error);

        res.status(
            error.code === "ER_NO_REFERENCED_ROW_2" ? 400 : 500
        ).json({
            message: "Không thể sửa suất chiếu"
        });
    }
};

exports.deleteShowtime = async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM showtimes WHERE id=?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        res.json({ message: "Xóa suất chiếu thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi xóa suất chiếu"
        });
    }
};
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { pool } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ========================================
// UPLOAD HÌNH ẢNH
// ========================================

const uploadDir = process.env.VERCEL
    ? "/tmp/toon-cinema-uploads"
    : path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(
            file.originalname
        ).toLowerCase();

        const filename =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000) +
            extension;

        cb(null, filename);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowed.includes(file.mimetype)) {
            return cb(
                new Error("Chỉ cho phép ảnh JPG, PNG hoặc WEBP")
            );
        }

        cb(null, true);
    }
});

// ========================================
// HÀM KIỂM TRA ID
// ========================================

function validId(value) {
    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0;
}

// ========================================
// KIỂM TRA BACKEND
// ========================================

app.get("/api/hello", (req, res) => {
    res.json({
        message: "TOON CINEMA Backend hoạt động!"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            status: "OK",
            database: "Connected",
            provider: "Neon PostgreSQL"
        });

    } catch (error) {
        console.error("Health Error:", error.message);

        res.status(500).json({
            status: "ERROR",
            message: "Không thể kết nối database"
        });
    }
});

// ========================================
// QUẢN LÝ PHIM
// ========================================

// Lấy danh sách phim
app.get("/api/movies", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM "Movies"
            ORDER BY "MovieID" DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Không thể tải danh sách phim"
        });
    }
});

// Thêm phim
app.post(
    "/api/movies",
    upload.single("image"),
    async (req, res) => {
        try {
            const { title, genre, duration } = req.body;

            const movieDuration = Number(duration);

            if (
                !title ||
                !genre ||
                !Number.isInteger(movieDuration) ||
                movieDuration <= 0
            ) {
                return res.status(400).json({
                    message: "Thông tin phim không hợp lệ"
                });
            }

            const imageUrl = req.file
                ? "/uploads/" + req.file.filename
                : null;

            await pool.query(
                `
                INSERT INTO "Movies"
                ("Title", "Genre", "Duration", "ImageUrl")
                VALUES ($1, $2, $3, $4)
                `,
                [
                    title,
                    genre,
                    movieDuration,
                    imageUrl
                ]
            );

            res.status(201).json({
                message: "Thêm phim thành công!"
            });

        } catch (error) {
            console.error(error.message);

            res.status(500).json({
                message: "Không thể thêm phim"
            });
        }
    }
);

// Sửa phim
app.put(
    "/api/movies/:id",
    upload.single("image"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            const { title, genre, duration } = req.body;
            const movieDuration = Number(duration);

            if (
                !validId(id) ||
                !title ||
                !genre ||
                !Number.isInteger(movieDuration) ||
                movieDuration <= 0
            ) {
                return res.status(400).json({
                    message: "Dữ liệu không hợp lệ"
                });
            }

            const oldMovie = await pool.query(
                `
                SELECT "ImageUrl"
                FROM "Movies"
                WHERE "MovieID" = $1
                `,
                [id]
            );

            if (oldMovie.rows.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy phim"
                });
            }

            const imageUrl = req.file
                ? "/uploads/" + req.file.filename
                : oldMovie.rows[0].ImageUrl;

            await pool.query(
                `
                UPDATE "Movies"
                SET
                    "Title" = $1,
                    "Genre" = $2,
                    "Duration" = $3,
                    "ImageUrl" = $4
                WHERE "MovieID" = $5
                `,
                [
                    title,
                    genre,
                    movieDuration,
                    imageUrl,
                    id
                ]
            );

            res.json({
                message: "Cập nhật phim thành công!"
            });

        } catch (error) {
            console.error(error.message);

            res.status(500).json({
                message: "Không thể cập nhật phim"
            });
        }
    }
);

// Xóa phim
app.delete("/api/movies/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!validId(id)) {
            return res.status(400).json({
                message: "ID không hợp lệ"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM "Movies"
            WHERE "MovieID" = $1
            `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        res.json({
            message: "Xóa phim thành công!"
        });

    } catch (error) {
        console.error(error.message);

        res.status(409).json({
            message: "Không thể xóa phim đang có lịch chiếu"
        });
    }
});

// ========================================
// QUẢN LÝ PHÒNG CHIẾU
// ========================================

// Lấy danh sách phòng
app.get("/api/rooms", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM "Rooms"
            ORDER BY "RoomID"
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Không thể tải phòng chiếu"
        });
    }
});

// Thêm phòng
app.post("/api/rooms", async (req, res) => {
    try {
        const { roomName } = req.body;

        if (
            typeof roomName !== "string" ||
            !roomName.trim()
        ) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phòng"
            });
        }

        await pool.query(
            `
            INSERT INTO "Rooms"
            ("RoomName", "NumberOfRows", "SeatPerRow")
            VALUES ($1, $2, $3)
            `,
            [roomName.trim(), 10, 8]
        );

        res.status(201).json({
            message: "Thêm phòng thành công!"
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Không thể thêm phòng"
        });
    }
});

// Xóa phòng
app.delete("/api/rooms/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!validId(id)) {
            return res.status(400).json({
                message: "ID không hợp lệ"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM "Rooms"
            WHERE "RoomID" = $1
            `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phòng"
            });
        }

        res.json({
            message: "Xóa phòng thành công!"
        });

    } catch (error) {
        console.error(error.message);

        res.status(409).json({
            message: "Không thể xóa phòng đang có lịch chiếu"
        });
    }
});

// ========================================
// QUẢN LÝ LỊCH CHIẾU
// ========================================

// Lấy danh sách lịch chiếu
app.get("/api/showtimes", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s."ShowtimeID",
                s."MovieID",
                s."RoomID",
                s."StartTime",
                s."TicketPrice",
                m."Title",
                r."RoomName"
            FROM "Showtimes" s
            JOIN "Movies" m
                ON s."MovieID" = m."MovieID"
            JOIN "Rooms" r
                ON s."RoomID" = r."RoomID"
            ORDER BY s."StartTime" DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Không thể tải lịch chiếu"
        });
    }
});

// Thêm lịch chiếu
app.post("/api/showtimes", async (req, res) => {
    try {
        const {
            movieId,
            roomId,
            startTime,
            ticketPrice
        } = req.body;

        const movie = Number(movieId);
        const room = Number(roomId);
        const price = Number(ticketPrice);
        const date = new Date(startTime);

        if (
            !validId(movie) ||
            !validId(room) ||
            !startTime ||
            Number.isNaN(date.getTime()) ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return res.status(400).json({
                message: "Thông tin lịch chiếu không hợp lệ"
            });
        }

        await pool.query(
            `
            INSERT INTO "Showtimes"
            ("MovieID", "RoomID", "StartTime", "TicketPrice")
            VALUES ($1, $2, $3, $4)
            `,
            [
                movie,
                room,
                date,
                price
            ]
        );

        res.status(201).json({
            message: "Tạo lịch chiếu thành công!"
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Không thể tạo lịch chiếu"
        });
    }
});

// Xóa lịch chiếu
app.delete("/api/showtimes/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!validId(id)) {
            return res.status(400).json({
                message: "ID không hợp lệ"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM "Showtimes"
            WHERE "ShowtimeID" = $1
            `,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Không tìm thấy lịch chiếu"
            });
        }

        res.json({
            message: "Xóa lịch chiếu thành công!"
        });

    } catch (error) {
        console.error(error.message);

        res.status(409).json({
            message: "Không thể xóa lịch chiếu đã có ghế đặt"
        });
    }
});

// ========================================
// QUẢN LÝ GHẾ
// ========================================

// Lấy danh sách ghế
app.get("/api/seats/:showtimeId", async (req, res) => {
    try {
        const showtimeId = Number(req.params.showtimeId);

        if (!validId(showtimeId)) {
            return res.status(400).json({
                message: "Mã suất chiếu không hợp lệ"
            });
        }

        const showtime = await pool.query(
            `
            SELECT
                r."NumberOfRows",
                r."SeatPerRow"
            FROM "Showtimes" s
            JOIN "Rooms" r
                ON s."RoomID" = r."RoomID"
            WHERE s."ShowtimeID" = $1
            `,
            [showtimeId]
        );

        if (showtime.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        const result = await pool.query(
            `
            SELECT "SeatCode"
            FROM "BookedSeats"
            WHERE "ShowtimeID" = $1
            `,
            [showtimeId]
        );

        res.json({
            rows: showtime.rows[0].NumberOfRows,
            columns: showtime.rows[0].SeatPerRow,
            bookedSeats: result.rows.map(
                item => item.SeatCode
            )
        });

    } catch (error) {
        console.error(error.message);

        res.status(500).json({
            message: "Không thể tải ghế"
        });
    }
});

// Đặt ghế
app.post("/api/seats/book", async (req, res) => {
    try {
        const { showtimeId, seatCode } = req.body;

        const id = Number(showtimeId);
        const code = String(seatCode || "")
            .trim()
            .toUpperCase();

        if (
            !validId(id) ||
            !/^[A-J][1-8]$/.test(code)
        ) {
            return res.status(400).json({
                message: "Thông tin ghế không hợp lệ"
            });
        }

        const showtime = await pool.query(
            `
            SELECT
                r."NumberOfRows",
                r."SeatPerRow"
            FROM "Showtimes" s
            JOIN "Rooms" r
                ON s."RoomID" = r."RoomID"
            WHERE s."ShowtimeID" = $1
            `,
            [id]
        );

        if (showtime.rows.length === 0) {
            return res.status(404).json({
                message: "Suất chiếu không tồn tại"
            });
        }

        const room = showtime.rows[0];
        const rowIndex = code.charCodeAt(0) - 64;
        const seatNumber = Number(code.slice(1));

        if (
            rowIndex > room.NumberOfRows ||
            seatNumber > room.SeatPerRow
        ) {
            return res.status(400).json({
                message: "Ghế không tồn tại trong phòng"
            });
        }

        await pool.query(
            `
            INSERT INTO "BookedSeats"
            ("ShowtimeID", "SeatCode")
            VALUES ($1, $2)
            `,
            [id, code]
        );

        res.status(201).json({
            message: "Đặt ghế thành công!"
        });

    } catch (error) {
        console.error(error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Ghế đã được đặt"
            });
        }

        res.status(500).json({
            message: "Không thể đặt ghế"
        });
    }
});

// ========================================
// XỬ LÝ LỖI
// ========================================

app.use((error, req, res, next) => {
    console.error(error);

    res.status(400).json({
        message: error.message || "Có lỗi xảy ra"
    });
});

// ========================================
// KHỞI ĐỘNG SERVER
// ========================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log("=================================");
        console.log("TOON CINEMA BACKEND");
        console.log("Database: Neon PostgreSQL");
        console.log(`http://localhost:${PORT}`);
        console.log("=================================");
    });
}

module.exports = app;
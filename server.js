require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { sql, getPool } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
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
// KIỂM TRA BACKEND
// ========================================

app.get("/api/hello", (req, res) => {
    res.json({
        message: "TOON CINEMA Backend hoạt động!"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const pool = await getPool();

        await pool.request().query("SELECT 1 AS OK");

        res.json({
            status: "OK",
            database: "Connected"
        });

    } catch (error) {
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
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT *
            FROM Movies
            ORDER BY MovieID DESC
        `);

        res.json(result.recordset);

    } catch (error) {
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

            if (
                !title ||
                !genre ||
                !Number.isInteger(Number(duration)) ||
                Number(duration) <= 0
            ) {
                return res.status(400).json({
                    message: "Thông tin phim không hợp lệ"
                });
            }

            const imageUrl = req.file
                ? "/uploads/" + req.file.filename
                : null;

            const pool = await getPool();

            await pool.request()
                .input("title", sql.NVarChar(200), title)
                .input("genre", sql.NVarChar(100), genre)
                .input("duration", sql.Int, Number(duration))
                .input("imageUrl", sql.NVarChar(500), imageUrl)
                .query(`
                    INSERT INTO Movies
                    (Title, Genre, Duration, ImageUrl)
                    VALUES
                    (@title, @genre, @duration, @imageUrl)
                `);

            res.status(201).json({
                message: "Thêm phim thành công!"
            });

        } catch (error) {
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

            if (
                !Number.isInteger(id) ||
                id <= 0 ||
                !title ||
                !genre ||
                !Number.isInteger(Number(duration)) ||
                Number(duration) <= 0
            ) {
                return res.status(400).json({
                    message: "Dữ liệu không hợp lệ"
                });
            }

            const pool = await getPool();

            const oldMovie = await pool.request()
                .input("id", sql.Int, id)
                .query(`
                    SELECT ImageUrl
                    FROM Movies
                    WHERE MovieID = @id
                `);

            if (!oldMovie.recordset.length) {
                return res.status(404).json({
                    message: "Không tìm thấy phim"
                });
            }

            const imageUrl = req.file
                ? "/uploads/" + req.file.filename
                : oldMovie.recordset[0].ImageUrl;

            await pool.request()
                .input("id", sql.Int, id)
                .input("title", sql.NVarChar(200), title)
                .input("genre", sql.NVarChar(100), genre)
                .input("duration", sql.Int, Number(duration))
                .input("imageUrl", sql.NVarChar(500), imageUrl)
                .query(`
                    UPDATE Movies
                    SET
                        Title = @title,
                        Genre = @genre,
                        Duration = @duration,
                        ImageUrl = @imageUrl
                    WHERE MovieID = @id
                `);

            res.json({
                message: "Cập nhật phim thành công!"
            });

        } catch (error) {
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

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID không hợp lệ"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM Movies
                WHERE MovieID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: "Không tìm thấy phim"
            });
        }

        res.json({
            message: "Xóa phim thành công!"
        });

    } catch (error) {
        res.status(409).json({
            message:
                "Không thể xóa phim đang có lịch chiếu"
        });
    }
});

// ========================================
// QUẢN LÝ PHÒNG CHIẾU
// ========================================

app.get("/api/rooms", async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT *
            FROM Rooms
            ORDER BY RoomID
        `);

        res.json(result.recordset);

    } catch (error) {
        res.status(500).json({
            message: "Không thể tải phòng chiếu"
        });
    }
});

app.post("/api/rooms", async (req, res) => {
    try {
        const { roomName } = req.body;

        if (!roomName || !roomName.trim()) {
            return res.status(400).json({
                message: "Vui lòng nhập tên phòng"
            });
        }

        const pool = await getPool();

        await pool.request()
            .input(
                "roomName",
                sql.NVarChar(100),
                roomName.trim()
            )
            .query(`
                INSERT INTO Rooms
                (RoomName, RowCount, SeatPerRow)
                VALUES (@roomName, 10, 8)
            `);

        res.status(201).json({
            message: "Thêm phòng thành công!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Không thể thêm phòng"
        });
    }
});

app.delete("/api/rooms/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const pool = await getPool();

        await pool.request()
            .input("id", sql.Int, id)
            .query(`
                DELETE FROM Rooms
                WHERE RoomID = @id
            `);

        res.json({
            message: "Xóa phòng thành công!"
        });

    } catch (error) {
        res.status(409).json({
            message:
                "Không thể xóa phòng đang có lịch chiếu"
        });
    }
});

// ========================================
// QUẢN LÝ LỊCH CHIẾU
// ========================================

app.get("/api/showtimes", async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT
                s.ShowtimeID,
                s.MovieID,
                s.RoomID,
                s.StartTime,
                s.TicketPrice,
                m.Title,
                r.RoomName
            FROM Showtimes s
            JOIN Movies m
                ON s.MovieID = m.MovieID
            JOIN Rooms r
                ON s.RoomID = r.RoomID
            ORDER BY s.StartTime DESC
        `);

        res.json(result.recordset);

    } catch (error) {
        res.status(500).json({
            message: "Không thể tải lịch chiếu"
        });
    }
});

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

        if (
            !Number.isInteger(movie) ||
            !Number.isInteger(room) ||
            !startTime ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            return res.status(400).json({
                message: "Thông tin lịch chiếu không hợp lệ"
            });
        }

        const pool = await getPool();

        await pool.request()
            .input("movieId", sql.Int, movie)
            .input("roomId", sql.Int, room)
            .input("startTime", sql.DateTime2, new Date(startTime))
            .input("price", sql.Decimal(12, 2), price)
            .query(`
                INSERT INTO Showtimes
                (MovieID, RoomID, StartTime, TicketPrice)
                VALUES
                (@movieId, @roomId, @startTime, @price)
            `);

        res.status(201).json({
            message: "Tạo lịch chiếu thành công!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Không thể tạo lịch chiếu"
        });
    }
});

app.delete("/api/showtimes/:id", async (req, res) => {
    try {
        const pool = await getPool();

        await pool.request()
            .input("id", sql.Int, Number(req.params.id))
            .query(`
                DELETE FROM Showtimes
                WHERE ShowtimeID = @id
            `);

        res.json({
            message: "Xóa lịch chiếu thành công!"
        });

    } catch (error) {
        res.status(409).json({
            message:
                "Không thể xóa lịch chiếu đã có ghế đặt"
        });
    }
});

// ========================================
// QUẢN LÝ GHẾ
// ========================================

app.get("/api/seats/:showtimeId", async (req, res) => {
    try {
        const showtimeId = Number(req.params.showtimeId);

        const pool = await getPool();

        const result = await pool.request()
            .input("id", sql.Int, showtimeId)
            .query(`
                SELECT SeatCode
                FROM BookedSeats
                WHERE ShowtimeID = @id
            `);

        res.json({
            rows: 10,
            columns: 8,
            bookedSeats: result.recordset.map(
                item => item.SeatCode
            )
        });

    } catch (error) {
        res.status(500).json({
            message: "Không thể tải ghế"
        });
    }
});

app.post("/api/seats/book", async (req, res) => {
    try {
        const { showtimeId, seatCode } = req.body;

        const id = Number(showtimeId);
        const code = String(seatCode || "").toUpperCase();

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !/^[A-J][1-8]$/.test(code)
        ) {
            return res.status(400).json({
                message: "Thông tin ghế không hợp lệ"
            });
        }

        const pool = await getPool();

        await pool.request()
            .input("showtimeId", sql.Int, id)
            .input("seatCode", sql.VarChar(5), code)
            .query(`
                INSERT INTO BookedSeats
                (ShowtimeID, SeatCode)
                VALUES
                (@showtimeId, @seatCode)
            `);

        res.status(201).json({
            message: "Đặt ghế thành công!"
        });

    } catch (error) {
        res.status(409).json({
            message:
                "Ghế đã được đặt hoặc suất chiếu không hợp lệ"
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
        console.log(`http://localhost:${PORT}`);
        console.log("=================================");
    });
}

module.exports = app;
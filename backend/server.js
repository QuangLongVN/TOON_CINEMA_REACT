require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const movieRoutes = require("./routes/movieRoutes");
const roomRoutes = require("./routes/roomRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const seatRoutes = require("./routes/seatRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json());

// API
app.use("/api/movies", movieRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/products", productRoutes);

// Trang chủ Backend
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">
            <title>TOON CINEMA Backend API</title>
            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f7f2ff;
                    font-family: Arial, sans-serif;
                }

                .box {
                    background: white;
                    padding: 45px;
                    border-radius: 18px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    max-width: 650px;
                }

                h1 {
                    color: #7c3aed;
                }

                p {
                    color: #666;
                }

                .status {
                    display: inline-block;
                    margin-top: 15px;
                    padding: 10px 20px;
                    border-radius: 25px;
                    background: #dcfce7;
                    color: #166534;
                    font-weight: bold;
                }

                a {
                    display: inline-block;
                    margin: 20px 8px 0;
                    color: #7c3aed;
                    text-decoration: none;
                }
            </style>
        </head>

        <body>
            <div class="box">
                <h1>🎬 TOON CINEMA Backend API 🎬</h1>

                <p>
                    Hệ thống máy chủ đang hoạt động
                    và sẵn sàng kết nối!
                </p>

                <div class="status">
                    ● Backend Online
                </div>

                <div>
                    <a href="/api/health">Kiểm tra Database</a>
                    <a href="/api/movies">Danh sách phim</a>
                    <a href="/api/rooms">Phòng chiếu</a>
                    <a href="/api/showtimes">Suất chiếu</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Kiểm tra Backend + MySQL
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            status: "OK",
            database: "Connected",
            provider: "MySQL"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            database: "Disconnected"
        });
    }
});

// Xử lý API không tồn tại
app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API không tồn tại"
    });
});

// Khởi động server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("==================================");
    console.log("TOON CINEMA BACKEND");
    console.log(`http://localhost:${PORT}`);
    console.log("==================================");
});
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const movieRoutes = require("./routes/movieRoutes");
const roomRoutes = require("./routes/roomRoutes");
const showtimeRoutes = require("./routes/showtimeRoutes");
const seatRoutes = require("./routes/seatRoutes");
const productRoutes = require("./routes/productRoutes");

const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// 1. CORS - CHO PHÉP FRONTEND VERCEL
// ========================================

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://toon-cinema.vercel.app",
        "https://toon-cinema-react.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ========================================
// 2. MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// 3. TRANG CHỦ BACKEND
// ========================================

app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TOON CINEMA Backend</title>
            <style>
                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    background: #f8f5ff;
                }

                .container {
                    padding: 40px;
                    border-radius: 20px;
                    background: white;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                }

                h1 {
                    color: #8b5cf6;
                }

                p {
                    color: #555;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎬 TOON CINEMA</h1>
                <h2>Backend API</h2>
                <p>Node.js + Express + TiDB Cloud</p>
                <p>Server is running successfully!</p>
            </div>
        </body>
        </html>
    `);
});

// ========================================
// 4. KIỂM TRA DATABASE
// ========================================

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            status: "OK",
            database: "Connected",
            provider: "MySQL"
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            status: "ERROR",
            database: "Disconnected"
        });
    }
});

// ========================================
// 5. API ROUTES
// ========================================

app.use("/api/movies", movieRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/products", productRoutes);

// ========================================
// 6. XỬ LÝ API KHÔNG TỒN TẠI
// ========================================

app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API không tồn tại"
    });
});

// ========================================
// 7. KHỞI ĐỘNG SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {
    console.log("================================");
    console.log("TOON CINEMA BACKEND");
    console.log(`Server running on port ${PORT}`);
    console.log("CORS enabled for Vercel");
    console.log("================================");
});
require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    console.error("Thiếu DATABASE_URL trong file .env");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
});

pool.on("error", (error) => {
    console.error("Lỗi kết nối PostgreSQL:", error.message);
});

const query = (text, params = []) => pool.query(text, params);

module.exports = {
    pool,
    query
};

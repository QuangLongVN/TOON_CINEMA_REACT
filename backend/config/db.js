const mysql = require("mysql2/promise");
require("dotenv").config();

const isLocal =
    process.env.DB_HOST === "127.0.0.1" ||
    process.env.DB_HOST === "localhost";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "toon_cinema",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(isLocal
        ? {}
        : {
              ssl: {
                  minVersion: "TLSv1.2",
                  rejectUnauthorized: true
              }
          })
});

module.exports = pool;
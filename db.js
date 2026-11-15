require("dotenv").config();

const sql = require("mssql");

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_NAME || "ToonCinema",

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_CERT !== "false",

        ...(process.env.DB_INSTANCE
            ? { instanceName: process.env.DB_INSTANCE }
            : {})
    },

    ...(process.env.DB_INSTANCE
        ? {}
        : { port: Number(process.env.DB_PORT || 1433) }),

    connectionTimeout: 30000,
    requestTimeout: 30000,

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .then(pool => {
                console.log("Ket noi SQL Server thanh cong!");
                return pool;
            })
            .catch(error => {
                poolPromise = null;
                console.error("Loi ket noi SQL Server:", error.message);
                throw error;
            });
    }

    return poolPromise;
}

module.exports = {
    sql,
    getPool
};

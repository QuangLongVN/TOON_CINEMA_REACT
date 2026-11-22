const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "toon_cinema_dev_secret";

// Xác thực token đăng nhập
exports.requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: "Vui lòng đăng nhập" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await db.query(
            "SELECT id, full_name, email, role FROM users WHERE id = ?",
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Tài khoản không tồn tại" });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

// Kiểm tra quyền admin
exports.requireAdmin = (req, res, next) => {
    if (!req.user || String(req.user.role || "").toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Bạn không có quyền truy cập chức năng quản trị" });
    }
    next();
};
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "toon_cinema_dev_secret";

function signToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// ĐĂNG KÝ
exports.register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body || {};

        if (!full_name || !String(full_name).trim()) {
            return res.status(400).json({ message: "Vui lòng nhập họ tên" });
        }

        if (!email || !/^\S+@\S+\.\S+$/.test(String(email).trim())) {
            return res.status(400).json({ message: "Email không hợp lệ" });
        }

        if (!password || String(password).length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: "Email này đã được đăng ký" });
        }

        const hashedPassword = await bcrypt.hash(String(password), 10);

        const [result] = await db.query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES (?, ?, ?, 'user')`,
            [String(full_name).trim(), cleanEmail, hashedPassword]
        );

        const user = {
            id: result.insertId,
            full_name: String(full_name).trim(),
            email: cleanEmail,
            role: "user"
        };

        const token = signToken(user);

        return res.status(201).json({
            message: "Đăng ký thành công",
            token,
            user
        });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        return res.status(500).json({ message: "Không thể đăng ký tài khoản" });
    }
};

// ĐĂNG NHẬP
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        const [rows] = await db.query(
            "SELECT id, full_name, email, password, role FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        const dbUser = rows[0];
        const isMatch = await bcrypt.compare(String(password), dbUser.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        const user = {
            id: dbUser.id,
            full_name: dbUser.full_name,
            email: dbUser.email,
            role: dbUser.role
        };

        const token = signToken(user);

        return res.json({
            message: "Đăng nhập thành công",
            token,
            user
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        return res.status(500).json({ message: "Không thể đăng nhập" });
    }
};

// LẤY THÔNG TIN USER HIỆN TẠI (KÈM HEADER AUTHORIZATION: BEARER <TOKEN>)
exports.getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: "Chưa đăng nhập" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const [rows] = await db.query(
            "SELECT id, full_name, email, role FROM users WHERE id = ?",
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        return res.json({ user: rows[0] });
    } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};
exports.updateUserRole = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const nextRole = String(req.body?.role || "").trim().toLowerCase();

        if (!userId || !["user", "admin"].includes(nextRole)) {
            return res.status(400).json({
                message: "Dữ liệu không hợp lệ. Role chỉ nhận 'user' hoặc 'admin'"
            });
        }

        const [result] = await db.query(
            "UPDATE users SET role = ? WHERE id = ?",
            [nextRole, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const [rows] = await db.query(
            "SELECT id, full_name, email, role FROM users WHERE id = ?",
            [userId]
        );

        return res.json({
            message: `Đã cập nhật quyền của người dùng thành '${nextRole}'`,
            user: rows[0]
        });
    } catch (error) {
        console.error("Lỗi cập nhật quyền:", error);
        return res.status(500).json({ message: "Không thể cập nhật quyền tài khoản" });
    }
};
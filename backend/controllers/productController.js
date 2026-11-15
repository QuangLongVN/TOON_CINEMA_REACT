const db = require("../config/db");

exports.getProducts = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM products ORDER BY id DESC"
        );

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy sản phẩm"
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM products WHERE id=?",
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi lấy sản phẩm"
        });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, price, quantity, image } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                message: "Thông tin sản phẩm không hợp lệ"
            });
        }

        const [result] = await db.query(
            `INSERT INTO products
             (name,price,quantity,image)
             VALUES (?,?,?,?)`,
            [
                name.trim(),
                Number(price),
                Number(quantity),
                image || null
            ]
        );

        res.status(201).json({
            message: "Thêm sản phẩm thành công",
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi thêm sản phẩm"
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, price, quantity, image } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                message: "Thông tin sản phẩm không hợp lệ"
            });
        }

        const [result] = await db.query(
            `UPDATE products
             SET name=?,price=?,quantity=?,image=?
             WHERE id=?`,
            [
                name.trim(),
                Number(price),
                Number(quantity),
                image || null,
                req.params.id
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }

        res.json({ message: "Sửa sản phẩm thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi sửa sản phẩm"
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM products WHERE id=?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm"
            });
        }

        res.json({ message: "Xóa sản phẩm thành công" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Lỗi xóa sản phẩm"
        });
    }
};
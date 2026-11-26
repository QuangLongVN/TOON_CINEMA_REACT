
const crypto = require("crypto");
const db = require("../config/db");

function makeTicketCode() {
    return `TC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// ============================================
// TẠO VÉ + TRỪ SỐ LƯỢNG SẢN PHẨM
// ============================================
exports.createTicket = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        const userId = Number(req.user.id);
        const showtimeId = Number(req.body.showtime_id);

        const seats = Array.isArray(req.body.seats)
            ? [
                  ...new Set(
                      req.body.seats.map((seat) =>
                          String(seat).trim().toUpperCase()
                      )
                  )
              ]
            : [];

        const combos = Array.isArray(req.body.combos)
            ? req.body.combos
            : [];

        const total = Number(req.body.total);

        // Kiểm tra dữ liệu cơ bản
        if (
            !Number.isInteger(userId) ||
            userId <= 0 ||
            !Number.isInteger(showtimeId) ||
            showtimeId <= 0 ||
            !seats.length ||
            seats.some((seat) => !/^[A-H](10|[1-9])$/.test(seat)) ||
            !Number.isFinite(total) ||
            total < 0
        ) {
            return res.status(400).json({
                message: "Thông tin đặt vé không hợp lệ"
            });
        }

        // Chuẩn hóa danh sách sản phẩm
        const productMap = new Map();

        for (const item of combos) {
            if (!item || typeof item !== "object") {
                return res.status(400).json({
                    message: "Thông tin sản phẩm không hợp lệ"
                });
            }

            const productId = Number(
                item.product_id ??
                item.productId ??
                item.product?.id ??
                item.id
            );

            const quantity = Number(
                item.quantity ??
                item.qty ??
                item.count ??
                item.amount ??
                0
            );

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Thông tin sản phẩm không hợp lệ"
                });
            }

            productMap.set(
                productId,
                (productMap.get(productId) || 0) + quantity
            );
        }

        // Bắt đầu transaction
        await connection.beginTransaction();
        transactionStarted = true;

        // ============================================
        // 1. KIỂM TRA SUẤT CHIẾU
        // ============================================
        const [showtimes] = await connection.query(
            `SELECT
                s.id,
                s.price,
                s.start_time,
                m.title AS movie_title,
                r.name AS room_name,
                r.total_seats
             FROM showtimes s
             JOIN movies m ON m.id = s.movie_id
             JOIN rooms r ON r.id = s.room_id
             WHERE s.id = ?
             FOR UPDATE`,
            [showtimeId]
        );

        if (!showtimes.length) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: "Không tìm thấy suất chiếu"
            });
        }

        const showtime = showtimes[0];

        // ============================================
        // 2. KIỂM TRA GHẾ
        // ============================================
        const seatIndexes = seats.map((seat) => {
            const row = seat.charCodeAt(0) - 65;
            return row * 10 + Number(seat.slice(1));
        });

        if (
            seatIndexes.some(
                (index) =>
                    index < 1 ||
                    index > Number(showtime.total_seats)
            )
        ) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: "Có ghế không tồn tại trong phòng"
            });
        }

        // ============================================
        // 3. KIỂM TRA VÀ TRỪ KHO SẢN PHẨM
        // ============================================
        const savedCombos = [];

        for (const [productId, quantity] of productMap) {
            const [products] = await connection.query(
                `SELECT id, name, price, quantity
                 FROM products
                 WHERE id = ?
                 FOR UPDATE`,
                [productId]
            );

            if (!products.length) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(404).json({
                    message: `Không tìm thấy sản phẩm ID ${productId}`
                });
            }

            const product = products[0];
            const stock = Number(product.quantity);

            if (stock < quantity) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    message: `Sản phẩm "${product.name}" chỉ còn ${stock} sản phẩm`
                });
            }

            const [updateResult] = await connection.query(
                `UPDATE products
                 SET quantity = quantity - ?
                 WHERE id = ? AND quantity >= ?`,
                [quantity, productId, quantity]
            );

            if (updateResult.affectedRows !== 1) {
                throw new Error(
                    `Không thể cập nhật số lượng sản phẩm ${product.name}`
                );
            }

            savedCombos.push({
                product_id: product.id,
                name: product.name,
                quantity,
                unit_price: Number(product.price)
            });
        }

        // ============================================
        // 4. KIỂM TRA GHẾ ĐÃ ĐƯỢC ĐẶT CHƯA
        // ============================================
        for (const seat of seats) {
            const [existingSeats] = await connection.query(
                `SELECT id
                 FROM booked_seats
                 WHERE showtime_id = ?
                   AND seat_number = ?
                 FOR UPDATE`,
                [showtimeId, seat]
            );

            if (existingSeats.length) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(409).json({
                    message: `Ghế ${seat} vừa được người khác đặt. Vui lòng chọn lại.`
                });
            }
        }

        // ============================================
        // 5. TẠO MÃ VÉ VÀ LƯU VÉ
        // ============================================
        const code = makeTicketCode();

        const [insertTicket] = await connection.query(
            `INSERT INTO tickets
                (
                    ticket_code,
                    user_id,
                    showtime_id,
                    seats,
                    combos,
                    total,
                    status
                )
             VALUES (?, ?, ?, ?, ?, ?, 'valid')`,
            [
                code,
                userId,
                showtimeId,
                JSON.stringify(seats),
                JSON.stringify(savedCombos),
                total
            ]
        );

        // ============================================
        // 6. LƯU GHẾ ĐÃ ĐẶT
        // ============================================
        for (const seat of seats) {
            await connection.query(
                `INSERT INTO booked_seats
                    (showtime_id, seat_number)
                 VALUES (?, ?)`,
                [showtimeId, seat]
            );
        }

        // ============================================
        // 7. HOÀN TẤT GIAO DỊCH
        // ============================================
        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: "Đặt vé thành công",
            ticket: {
                id: insertTicket.insertId,
                code,
                ticket_code: code,
                customer: req.user.full_name,
                movieTitle: showtime.movie_title,
                roomName: showtime.room_name,
                startTime: showtime.start_time,
                seats,
                combos: savedCombos,
                total,
                status: "valid"
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Lỗi rollback:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Có ghế vừa được người khác đặt. Vui lòng chọn lại."
            });
        }

        console.error("Lỗi tạo vé:", error);

        return res.status(500).json({
            message: "Không thể hoàn tất đặt vé"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ============================================
// LẤY DANH SÁCH VÉ CỦA USER
// ============================================
exports.getMyTickets = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                t.id,
                t.ticket_code,
                t.seats,
                t.combos,
                t.total,
                t.status,
                t.created_at,
                s.start_time,
                s.price,
                m.title AS movie_title,
                r.name AS room_name
             FROM tickets t
             JOIN showtimes s ON s.id = t.showtime_id
             JOIN movies m ON m.id = s.movie_id
             JOIN rooms r ON r.id = s.room_id
             WHERE t.user_id = ?
             ORDER BY t.created_at DESC`,
            [req.user.id]
        );

        return res.json(
            rows.map((row) => ({
                ...row,
                seats:
                    typeof row.seats === "string"
                        ? JSON.parse(row.seats)
                        : row.seats,
                combos:
                    typeof row.combos === "string"
                        ? JSON.parse(row.combos)
                        : row.combos
            }))
        );
    } catch (error) {
        console.error("Lỗi lấy vé:", error);

        return res.status(500).json({
            message: "Không thể tải danh sách vé"
        });
    }
};

// ============================================
// KIỂM TRA MÃ VÉ
// ============================================
exports.checkMyTicket = async (req, res) => {
    try {
        const code = String(req.params.code || "")
            .trim()
            .toUpperCase();

        const [rows] = await db.query(
            `SELECT
                t.id,
                t.ticket_code,
                t.seats,
                t.combos,
                t.total,
                t.status,
                t.created_at,
                s.start_time,
                m.title AS movie_title,
                r.name AS room_name
             FROM tickets t
             JOIN showtimes s ON s.id = t.showtime_id
             JOIN movies m ON m.id = s.movie_id
             JOIN rooms r ON r.id = s.room_id
             WHERE t.ticket_code = ?
               AND t.user_id = ?`,
            [code, req.user.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                message: "Không tìm thấy vé thuộc tài khoản của bạn"
            });
        }

        const row = rows[0];

        return res.json({
            ...row,
            seats:
                typeof row.seats === "string"
                    ? JSON.parse(row.seats)
                    : row.seats,
            combos:
                typeof row.combos === "string"
                    ? JSON.parse(row.combos)
                    : row.combos
        });
    } catch (error) {
        console.error("Lỗi kiểm tra vé:", error);

        return res.status(500).json({
            message: "Không thể kiểm tra vé"
        });
    }
};

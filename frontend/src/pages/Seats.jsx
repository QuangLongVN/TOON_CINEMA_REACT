import { useEffect, useState } from "react";
import { seatAPI, showtimeAPI, roomAPI } from "../services/api";

export default function Seats() {
    const [showtimes, setShowtimes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [selectedShowtime, setSelectedShowtime] = useState("");
    const [bookedSeats, setBookedSeats] = useState([]);
    const [loading, setLoading] = useState(false);

    // LẤY DANH SÁCH SUẤT CHIẾU VÀ PHÒNG
    useEffect(() => {
        async function loadData() {
            try {
                const [showtimeRes, roomRes] = await Promise.all([
                    showtimeAPI.getAll(),
                    roomAPI.getAll()
                ]);

                setShowtimes(showtimeRes.data);
                setRooms(roomRes.data);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
                alert("Không thể tải dữ liệu suất chiếu hoặc phòng.");
            }
        }

        loadData();
    }, []);

    // LẤY DANH SÁCH GHẾ ĐÃ ĐẶT
    async function loadSeats(id) {
        if (!id) {
            setBookedSeats([]);
            return;
        }

        try {
            setLoading(true);

            const res = await seatAPI.getBooked(id);

            setBookedSeats(res.data);
        } catch (error) {
            console.error("Lỗi tải ghế:", error);
            alert("Không thể tải danh sách ghế.");
        } finally {
            setLoading(false);
        }
    }

    // ĐẶT / HỦY ĐẶT GHẾ
    async function handleSeatClick(seatNumber) {
        if (!selectedShowtime) return;

        const booked = bookedSeats.find(
            (item) => item.seat_number === seatNumber
        );

        try {
            if (booked) {
                if (!window.confirm(`Hủy đặt ghế ${seatNumber}?`)) {
                    return;
                }

                await seatAPI.cancel(booked.id);
            } else {
                if (!window.confirm(`Đặt ghế ${seatNumber}?`)) {
                    return;
                }

                await seatAPI.book({
                    showtime_id: Number(selectedShowtime),
                    seat_number: seatNumber
                });
            }

            await loadSeats(selectedShowtime);
        } catch (error) {
            console.error("Lỗi thao tác ghế:", error);

            alert(
                error.response?.data?.message ||
                "Thao tác thất bại."
            );
        }
    }

    // SUẤT CHIẾU ĐANG CHỌN
    const currentShowtime = showtimes.find(
        (item) => String(item.id) === String(selectedShowtime)
    );

    // PHÒNG CHIẾU CỦA SUẤT CHIẾU
    const currentRoom = rooms.find(
        (room) =>
            String(room.id) === String(currentShowtime?.room_id)
    );

    // LẤY SỐ GHẾ THỰC TẾ TỪ DATABASE
    const totalSeats = Number(currentRoom?.total_seats || 0);

    // TỰ ĐỘNG TẠO DANH SÁCH GHẾ
    // Ví dụ: 20 ghế => A1-A10, B1-B10
    const seats = Array.from(
        { length: totalSeats },
        (_, index) => {
            const rowIndex = Math.floor(index / 10);
            const column = (index % 10) + 1;

            // A, B, C ... Z, AA, AB ...
            let row = "";
            let number = rowIndex + 1;

            while (number > 0) {
                number--;
                row = String.fromCharCode(65 + (number % 26)) + row;
                number = Math.floor(number / 26);
            }

            return `${row}${column}`;
        }
    );

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Sơ đồ ghế</h3>
                    <p>Chọn suất chiếu để quản lý ghế</p>
                </div>
            </div>

            <div className="seat-selector">
                <label>Suất chiếu</label>

                <select
                    value={selectedShowtime}
                    onChange={(e) => {
                        const id = e.target.value;

                        setSelectedShowtime(id);
                        setBookedSeats([]);

                        loadSeats(id);
                    }}
                >
                    <option value="">
                        -- Chọn suất chiếu --
                    </option>

                    {showtimes.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.movie_title} - {item.room_name} -{" "}
                            {new Date(item.start_time).toLocaleString("vi-VN")}
                        </option>
                    ))}
                </select>
            </div>

            {currentShowtime && currentRoom && (
                <>
                    <div className="screen">
                        MÀN HÌNH CHIẾU
                    </div>

                    <div className="seat-grid">
                        {seats.map((seat) => {
                            const booked = bookedSeats.some(
                                (item) => item.seat_number === seat
                            );

                            return (
                                <button
                                    key={seat}
                                    disabled={loading}
                                    className={`seat ${
                                        booked ? "booked" : "available"
                                    }`}
                                    onClick={() => handleSeatClick(seat)}
                                >
                                    {seat}
                                </button>
                            );
                        })}
                    </div>

                    <div className="seat-legend">
                        <span>
                            <i className="legend-box available"></i>
                            Ghế trống
                        </span>

                        <span>
                            <i className="legend-box booked"></i>
                            Đã đặt
                        </span>
                    </div>
                </>
            )}

            {currentShowtime && !currentRoom && (
                <div className="empty">
                    Không tìm thấy thông tin phòng chiếu.
                </div>
            )}

            {!currentShowtime && (
                <div className="empty">
                    Vui lòng chọn suất chiếu.
                </div>
            )}
        </div>
    );
}
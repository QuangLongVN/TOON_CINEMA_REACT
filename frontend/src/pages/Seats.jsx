import { useEffect, useState } from "react";
import { seatAPI, showtimeAPI } from "../services/api";

export default function Seats() {
    const [showtimes, setShowtimes] = useState([]);
    const [selectedShowtime, setSelectedShowtime] = useState("");
    const [bookedSeats, setBookedSeats] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        showtimeAPI.getAll()
            .then((res) => {
                setShowtimes(
                    Array.isArray(res.data) ? res.data : []
                );
            })
            .catch((error) => {
                console.error("Lỗi tải suất chiếu:", error);
                alert("Không thể tải suất chiếu.");
            });
    }, []);

    async function loadSeats(id) {
        if (!id) {
            setBookedSeats([]);
            return;
        }

        try {
            setLoading(true);

            const res = await seatAPI.getBooked(id);

            setBookedSeats(
                Array.isArray(res.data) ? res.data : []
            );
        } catch (error) {
            console.error("Lỗi tải ghế:", error);
            alert("Không thể tải danh sách ghế.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSeatClick(seatNumber) {
        if (!selectedShowtime || loading) return;

        const booked = bookedSeats.find(
            (item) => item.seat_number === seatNumber
        );

        try {
            setLoading(true);

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
        } finally {
            setLoading(false);
        }
    }

    const currentShowtime = showtimes.find(
        (item) => String(item.id) === String(selectedShowtime)
    );

    // MỖI PHÒNG CỐ ĐỊNH 80 GHẾ
    // 8 hàng A-H, mỗi hàng 10 ghế
    const seats = Array.from({ length: 80 }, (_, index) => {
        const row = String.fromCharCode(
            65 + Math.floor(index / 10)
        );

        const column = (index % 10) + 1;

        return `${row}${column}`;
    });

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Sơ đồ ghế</h3>
                    <p>
                        Mỗi phòng chiếu có 80 ghế
                        (8 hàng × 10 ghế)
                    </p>
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

            {currentShowtime && (
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

            {!currentShowtime && (
                <div className="empty">
                    Vui lòng chọn suất chiếu.
                </div>
            )}
        </div>
    );
}
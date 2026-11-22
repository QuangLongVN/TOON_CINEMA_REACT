import { useEffect, useState } from "react";
import {
    Film,
    DoorOpen,
    CalendarDays,
    Armchair,
    Popcorn
} from "lucide-react";

import {
    movieAPI,
    roomAPI,
    showtimeAPI,
    productAPI
} from "../services/api";

export default function Dashboard() {
    const [stats, setStats] = useState({
        movies: 0,
        rooms: 0,
        showtimes: 0,
        seats: 0,
        products: 0
    });

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadStats() {
            try {
                const [movies, rooms, showtimes, products] =
                    await Promise.all([
                        movieAPI.getAll(),
                        roomAPI.getAll(),
                        showtimeAPI.getAll(),
                        productAPI.getAll()
                    ]);

                setStats({
                    movies: movies.data.length,
                    rooms: rooms.data.length,
                    showtimes: showtimes.data.length,
                    seats: rooms.data.reduce(
                        (total, room) =>
                            total + Number(room.total_seats || 0),
                        0
                    ),
                    products: products.data.length
                });
            } catch (err) {
                console.error(err);
                setError("Không thể kết nối Backend. Hãy kiểm tra Node.js.");
            }
        }

        loadStats();
    }, []);

    const cards = [
        {
            label: "Tổng số phim",
            value: stats.movies,
            icon: Film,
            color: "purple"
        },
        {
            label: "Phòng chiếu",
            value: stats.rooms,
            icon: DoorOpen,
            color: "pink"
        },
        {
            label: "Suất chiếu",
            value: stats.showtimes,
            icon: CalendarDays,
            color: "blue"
        },
        {
            label: "Tổng ghế",
            value: stats.seats,
            icon: Armchair,
            color: "orange"
        },
        {
            label: "Sản phẩm",
            value: stats.products,
            icon: Popcorn,
            color: "green"
        }
    ];

    return (
        <div>
            <div className="welcome-banner">
                <div>
                    <span className="welcome-tag">CINEMA MANAGEMENT</span>
                    <h2>Chào mừng đến với TOON CINEMA 🎬</h2>
                    <p>
                        Quản lý phim, phòng chiếu, lịch chiếu
                        và sản phẩm trên cùng một hệ thống.
                    </p>
                </div>
                <div className="banner-emoji">🍿</div>
            </div>

            {error && <div className="alert">{error}</div>}

            <div className="stats-grid">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div className="stat-card" key={card.label}>
                            <div className={`stat-icon ${card.color}`}>
                                <Icon size={24} />
                            </div>

                            <div className="stat-info">
                                <span>{card.label}</span>
                                <strong>{card.value}</strong>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
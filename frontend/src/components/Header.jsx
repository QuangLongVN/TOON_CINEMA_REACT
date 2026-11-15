import { Bell, Search } from "lucide-react";

const titles = {
    dashboard: "Tổng quan hệ thống",
    movies: "Quản lý phim",
    rooms: "Quản lý phòng chiếu",
    showtimes: "Quản lý suất chiếu",
    seats: "Quản lý ghế",
    products: "Quản lý sản phẩm"
};

export default function Header({ active }) {
    return (
        <header className="topbar">
            <div>
                <div className="breadcrumb">
                    TOON CINEMA / {titles[active]}
                </div>
                <h1>{titles[active]}</h1>
            </div>

            <div className="topbar-right">
                <div className="search-box">
                    <Search size={18} />
                    <span>Hệ thống quản lý rạp phim</span>
                </div>

                <button className="icon-button" aria-label="Thông báo">
                    <Bell size={20} />
                </button>

                <div className="header-avatar">A</div>
            </div>
        </header>
    );
}
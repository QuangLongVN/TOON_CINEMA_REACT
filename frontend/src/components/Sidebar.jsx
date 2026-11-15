import {
    LayoutDashboard,
    Film,
    DoorOpen,
    CalendarDays,
    Armchair,
    Popcorn
} from "lucide-react";

const menus = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "movies", label: "Quản lý phim", icon: Film },
    { id: "rooms", label: "Phòng chiếu", icon: DoorOpen },
    { id: "showtimes", label: "Suất chiếu", icon: CalendarDays },
    { id: "seats", label: "Quản lý ghế", icon: Armchair },
    { id: "products", label: "Sản phẩm", icon: Popcorn }
];

export default function Sidebar({ active, setActive }) {
    return (
        <aside className="sidebar">
            <div className="brand">
                <span className="brand-icon">🎬</span>
                <div>
                    <strong>TOON CINEMA</strong>
                    <small>Management System</small>
                </div>
            </div>

            <div className="sidebar-label">MENU QUẢN LÝ</div>

            <nav className="sidebar-menu">
                {menus.map((menu) => {
                    const Icon = menu.icon;

                    return (
                        <button
                            key={menu.id}
                            className={`menu-item ${
                                active === menu.id ? "active" : ""
                            }`}
                            onClick={() => setActive(menu.id)}
                        >
                            <Icon size={19} />
                            <span>{menu.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="avatar">A</div>
                <div>
                    <strong>Administrator</strong>
                    <small>Quản trị hệ thống</small>
                </div>
            </div>
        </aside>
    );
}
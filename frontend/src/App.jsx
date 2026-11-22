import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";

import Movies from "./pages/Movies";
import Rooms from "./pages/Rooms";
import Showtimes from "./pages/Showtimes";
import Seats from "./pages/Seats";
import Products from "./pages/Products";
import UserHome from "./pages/UserHome";

function AdminLayout() {
    const [active, setActive] = useState("dashboard");

    function renderPage() {
        switch (active) {
            case "movies":
                return <Movies />;
            case "rooms":
                return <Rooms />;
            case "showtimes":
                return <Showtimes />;
            case "seats":
                return <Seats />;
            case "products":
                return <Products />;
            default:
                return <Dashboard />;
        }
    }

    return (
        <div className="app-layout">
            <Sidebar active={active} setActive={setActive} />

            <main className="main-content">
                <Header active={active} />

                <div style={{ padding: "12px 35px 0", display: "flex", justifyContent: "flex-end" }}>
                    <Link
                        to="/"
                        style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#7c3aed",
                            textDecoration: "none",
                            background: "#f3e8ff",
                            padding: "6px 14px",
                            borderRadius: "8px"
                        }}
                    >
                        ← Xem trang khách hàng (User)
                    </Link>
                </div>

                <div className="page-content">{renderPage()}</div>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<UserHome />} />
                <Route path="/admin/*" element={<AdminLayout />} />
            </Routes>
        </BrowserRouter>
    );
}
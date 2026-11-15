import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";

import Movies from "./pages/Movies";
import Rooms from "./pages/Rooms";
import Showtimes from "./pages/Showtimes";
import Seats from "./pages/Seats";
import Products from "./pages/Products";

export default function App() {
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

                <div className="page-content">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
}
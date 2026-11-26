
import { notify } from "../components/NotificationHost";
import { useEffect, useState, useMemo } from "react";
import {
    Film,
    Clock,
    Ticket,
    Popcorn,
    Calendar,
    CheckCircle2,
    X,
    ShieldCheck,
    Sparkles,
    LogIn,
    LogOut
} from "lucide-react";
import {
    movieAPI,
    showtimeAPI,
    seatAPI,
    productAPI,
    ticketAPI
} from "../services/api";

function resolveApiBase() {
    const raw = (
        import.meta.env.VITE_API_URL || "http://localhost:3000/api"
    )
        .trim()
        .replace(/\/+$/, "");

    return raw.endsWith("/api") ? raw : `${raw}/api`;
}

const API_BASE = resolveApiBase();

function getStoredUser() {
    try {
        const raw = localStorage.getItem("toon_user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export default function UserHome() {
    const [movies, setMovies] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentUser, setCurrentUser] = useState(getStoredUser);
    const [statusFilter, setStatusFilter] = useState("ALL");

    // State cho Modal Đăng nhập / Đăng ký
    const [authModal, setAuthModal] = useState({
        open: false,
        mode: "login"
    });

    const [authForm, setAuthForm] = useState({
        full_name: "",
        email: "",
        password: ""
    });

    const [authMessage, setAuthMessage] = useState({
        type: "",
        text: ""
    });

    const [authSubmitting, setAuthSubmitting] = useState(false);

    const [selectedMovie, setSelectedMovie] = useState(null);
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [cartProducts, setCartProducts] = useState({});

    const [customerName, setCustomerName] = useState(
        () => getStoredUser()?.full_name || ""
    );

    const [bookingLoading, setBookingLoading] = useState(false);
    const [ticketReceipt, setTicketReceipt] = useState(null);
    const [myTickets, setMyTickets] = useState([]);

    const [ticketLookupCode, setTicketLookupCode] = useState("");
    const [ticketLookupResult, setTicketLookupResult] = useState(null);
    const [ticketLookupLoading, setTicketLookupLoading] = useState(false);

    // ============================================
    // TẢI DỮ LIỆU BAN ĐẦU
    // ============================================
    useEffect(() => {
        async function fetchInitialData() {
            try {
                setLoading(true);

                const [mRes, sRes, pRes] = await Promise.all([
                    movieAPI.getAll(),
                    showtimeAPI.getAll(),
                    productAPI.getAll()
                ]);

                setMovies(Array.isArray(mRes.data) ? mRes.data : []);
                setShowtimes(Array.isArray(sRes.data) ? sRes.data : []);
                setProducts(Array.isArray(pRes.data) ? pRes.data : []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu trang chủ:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchInitialData();
    }, []);

    // ============================================
    // TẢI VÉ CỦA USER KHI ĐĂNG NHẬP
    // ============================================
    useEffect(() => {
        if (currentUser?.id) {
            loadMyTickets();
        }
    }, [currentUser?.id]);

    function openAuth(mode) {
        setAuthMessage({ type: "", text: "" });
        setAuthForm({
            full_name: "",
            email: "",
            password: ""
        });
        setAuthModal({ open: true, mode });
    }

    function closeAuth() {
        setAuthModal((prev) => ({
            ...prev,
            open: false
        }));

        setAuthMessage({ type: "", text: "" });
    }

    // ============================================
    // ĐĂNG NHẬP / ĐĂNG KÝ
    // ============================================
    async function handleAuthSubmit(e) {
        e.preventDefault();
        setAuthMessage({ type: "", text: "" });

        if (!authForm.email.trim() || !authForm.password.trim()) {
            setAuthMessage({
                type: "error",
                text: "Vui lòng nhập đầy đủ email và mật khẩu!"
            });
            return;
        }

        if (
            authModal.mode === "register" &&
            !authForm.full_name.trim()
        ) {
            setAuthMessage({
                type: "error",
                text: "Vui lòng nhập họ tên để đăng ký tài khoản!"
            });
            return;
        }

        const endpoint =
            authModal.mode === "login"
                ? `${API_BASE}/auth/login`
                : `${API_BASE}/auth/register`;

        const payload =
            authModal.mode === "login"
                ? {
                      email: authForm.email.trim(),
                      password: authForm.password
                  }
                : {
                      full_name: authForm.full_name.trim(),
                      email: authForm.email.trim(),
                      password: authForm.password
                  };

        try {
            setAuthSubmitting(true);

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const contentType = res.headers.get("content-type") || "";

            const data = contentType.includes("application/json")
                ? await res.json()
                : { message: await res.text() };

            if (!res.ok) {
                setAuthMessage({
                    type: "error",
                    text:
                        data.message ||
                        (authModal.mode === "login"
                            ? "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!"
                            : "Đăng ký thất bại. Email có thể đã tồn tại!")
                });
                return;
            }

            if (authModal.mode === "register") {
                setAuthMessage({
                    type: "success",
                    text:
                        data.message ||
                        "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay."
                });

                setAuthModal({
                    open: true,
                    mode: "login"
                });

                setAuthForm((prev) => ({
                    ...prev,
                    password: ""
                }));

                return;
            }

            const loggedUser = data.user || data.data?.user || data;
            const token = data.token || data.data?.token || "";

            if (token) {
                localStorage.setItem("toon_token", token);
            }

            localStorage.setItem(
                "toon_user",
                JSON.stringify(loggedUser)
            );

            setCurrentUser(loggedUser);
            await loadMyTickets();

            if (loggedUser?.full_name) {
                setCustomerName(loggedUser.full_name);
            }

            setAuthMessage({
                type: "success",
                text: `Đăng nhập thành công! Chào mừng ${
                    loggedUser.full_name || loggedUser.email
                }.`
            });

            setTimeout(() => {
                closeAuth();
            }, 600);
        } catch (err) {
            console.error("Lỗi xác thực:", err);

            setAuthMessage({
                type: "error",
                text: "Không thể kết nối tới máy chủ. Vui lòng thử lại!"
            });
        } finally {
            setAuthSubmitting(false);
        }
    }

    // ============================================
    // LẤY DANH SÁCH VÉ CỦA TÔI
    // ============================================
    async function loadMyTickets() {
        try {
            const response = await ticketAPI.getMine();

            setMyTickets(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (error) {
            console.error("Lỗi tải vé của tôi:", error);

            notify(
                error.response?.data?.message ||
                    "Không thể tải danh sách vé.",
                "error"
            );
        }
    }

    // ============================================
    // KIỂM TRA MÃ VÉ
    // ============================================
    async function handleTicketLookup(e) {
        e.preventDefault();

        if (!ticketLookupCode.trim()) {
            notify("Vui lòng nhập mã vé cần kiểm tra.", "warning");
            return;
        }

        try {
            setTicketLookupLoading(true);

            const response = await ticketAPI.check(
                ticketLookupCode.trim()
            );

            setTicketLookupResult(response.data);

            notify("Tìm thấy vé trong tài khoản của bạn.", "success");
        } catch (error) {
            setTicketLookupResult(null);

            notify(
                error.response?.data?.message || "Không tìm thấy vé.",
                "error"
            );
        } finally {
            setTicketLookupLoading(false);
        }
    }

    // ============================================
    // ĐĂNG XUẤT
    // ============================================
    function handleLogout() {
        localStorage.removeItem("toon_token");
        localStorage.removeItem("toon_user");

        setCurrentUser(null);
        setMyTickets([]);
        setTicketLookupResult(null);
    }

    // ============================================
    // KIỂM TRA QUYỀN ADMIN
    // ============================================
    function handleAdminAccess() {
        if (!currentUser) {
            notify(
                "Vui lòng đăng nhập bằng tài khoản Admin để truy cập Trang Quản Trị!"
            );

            openAuth("login");
            return;
        }

        if (
            String(currentUser.role || "").toLowerCase() !== "admin"
        ) {
            notify(
                "Tài khoản hiện tại không có quyền Admin để truy cập Trang Quản Trị!"
            );
            return;
        }

        window.location.href = "/admin";
    }

    // ============================================
    // LỌC PHIM
    // ============================================
    const filteredMovies = useMemo(() => {
        if (statusFilter === "ALL") return movies;

        return movies.filter(
            (movie) =>
                (movie.status || "Đang chiếu") === statusFilter
        );
    }, [movies, statusFilter]);

    // ============================================
    // LẤY SUẤT CHIẾU CỦA PHIM ĐANG CHỌN
    // ============================================
    const movieShowtimes = useMemo(() => {
        if (!selectedMovie) return [];

        return showtimes.filter(
            (showtime) =>
                Number(showtime.movie_id) ===
                Number(selectedMovie.id)
        );
    }, [showtimes, selectedMovie]);

    // ============================================
    // MỞ MODAL ĐẶT VÉ
    // ============================================
    function openMovieBooking(movie) {
        if (!currentUser) {
            notify(
                "Vui lòng đăng nhập trước khi chọn suất và đặt vé!"
            );

            openAuth("login");
            return;
        }

        setSelectedMovie(movie);
        setSelectedShowtime(null);
        setBookedSeats([]);
        setSelectedSeats([]);
        setCartProducts({});
        setTicketReceipt(null);

        if (currentUser?.full_name && !customerName) {
            setCustomerName(currentUser.full_name);
        }
    }

    // ============================================
    // CHỌN SUẤT CHIẾU
    // ============================================
    async function handleSelectShowtime(st) {
        setSelectedShowtime(st);
        setSelectedSeats([]);

        try {
            const res = await seatAPI.getBooked(st.id);

            const list = Array.isArray(res.data)
                ? res.data
                : [];

            setBookedSeats(
                list.map((item) => item.seat_number)
            );
        } catch (err) {
            console.error("Lỗi tải ghế:", err);

            notify(
                "Không thể tải sơ đồ ghế của suất chiếu này."
            );
        }
    }

    // ============================================
    // CHỌN / BỎ CHỌN GHẾ
    // ============================================
    function toggleSeat(seatNumber) {
        if (bookedSeats.includes(seatNumber)) return;

        setSelectedSeats((prev) =>
            prev.includes(seatNumber)
                ? prev.filter((seat) => seat !== seatNumber)
                : [...prev, seatNumber]
        );
    }

    // ============================================
    // CẬP NHẬT SỐ LƯỢNG SẢN PHẨM
    // ============================================
    function updateProductQty(product, delta) {
        setCartProducts((prev) => {
            const current = prev[product.id] || 0;

            const next = Math.max(
                0,
                Math.min(
                    Number(product.quantity ?? 99),
                    current + delta
                )
            );

            const copy = { ...prev };

            if (next === 0) {
                delete copy[product.id];
            } else {
                copy[product.id] = next;
            }

            return copy;
        });
    }

    // ============================================
    // TÍNH TIỀN GHẾ
    // ============================================
    const seatTotal = selectedShowtime
        ? selectedSeats.length *
          Number(selectedShowtime.price || 0)
        : 0;

    // ============================================
    // TÍNH TIỀN SẢN PHẨM
    // ============================================
    const productTotal = Object.entries(cartProducts).reduce(
        (sum, [prodId, qty]) => {
            const product = products.find(
                (item) => Number(item.id) === Number(prodId)
            );

            return (
                sum +
                (product
                    ? Number(product.price) * qty
                    : 0)
            );
        },
        0
    );

    const grandTotal = seatTotal + productTotal;

    // ============================================
    // XÁC NHẬN ĐẶT VÉ
    // ============================================
    async function handleConfirmBooking() {
        if (!selectedShowtime || selectedSeats.length === 0) {
            notify("Vui lòng chọn ít nhất 1 ghế!", "warning");
            return;
        }

        try {
            setBookingLoading(true);

            // Gửi ID sản phẩm và số lượng lên backend
            const chosenCombos = Object.entries(cartProducts)
                .map(([id, qty]) => ({
                    product_id: Number(id),
                    quantity: Number(qty)
                }))
                .filter(
                    (item) =>
                        item.product_id > 0 &&
                        item.quantity > 0
                );

            const response = await ticketAPI.create({
                showtime_id: Number(selectedShowtime.id),
                seats: selectedSeats,
                combos: chosenCombos,
                total: grandTotal
            });

            const ticket = response.data.ticket;

            setTicketReceipt({
                code: ticket.code || ticket.ticket_code,
                customer:
                    ticket.customer ||
                    currentUser?.full_name ||
                    "Khách hàng TOON",
                movieTitle:
                    ticket.movieTitle || selectedMovie.title,
                roomName:
                    ticket.roomName || selectedShowtime.room_name,
                startTime:
                    ticket.startTime || selectedShowtime.start_time,
                seats: ticket.seats || [...selectedSeats],
                combos: ticket.combos || [],
                total: Number(ticket.total ?? grandTotal)
            });

            setBookedSeats((prev) => [
                ...prev,
                ...selectedSeats
            ]);

            setSelectedSeats([]);
            setCartProducts({});

            // Cập nhật tồn kho trên giao diện
            setProducts((prev) =>
                prev.map((product) => {
                    const ordered = chosenCombos.find(
                        (item) =>
                            item.product_id === Number(product.id)
                    );

                    return ordered
                        ? {
                              ...product,
                              quantity: Math.max(
                                  0,
                                  Number(product.quantity) -
                                      ordered.quantity
                              )
                          }
                        : product;
                })
            );

            await loadMyTickets();

            notify(
                "Đặt vé thành công! Mã vé đã được lưu vào tài khoản.",
                "success"
            );
        } catch (err) {
            console.error(
                "Lỗi đặt vé:",
                err.response?.data || err
            );

            notify(
                err.response?.data?.message ||
                    "Đặt vé thất bại. Vui lòng kiểm tra lại ghế và sản phẩm!",
                "error"
            );
        } finally {
            setBookingLoading(false);
        }
    }

    // ============================================
    // DANH SÁCH 80 GHẾ
    // ============================================
    const allSeats = Array.from(
        { length: 80 },
        (_, idx) => {
            const row = String.fromCharCode(
                65 + Math.floor(idx / 10)
            );

            const col = (idx % 10) + 1;

            return `${row}${col}`;
        }
    );

    return (
        <div className="user-portal">
            <header className="user-navbar">
                <div className="user-nav-inner">
                    <div className="user-logo">
                        <span className="brand-icon">🎬</span>

                        <div>
                            <strong>TOON CINEMA</strong>
                            <small>
                                Thế giới điện ảnh & hoạt hình
                            </small>
                        </div>
                    </div>

                    <nav className="user-nav-links">
                        <a href="#movies-section">
                            Phim chiếu rạp
                        </a>

                        <a href="#combos-section">
                            Bắp & Nước
                        </a>

                        {currentUser && (
                            <a href="#my-tickets-section">
                                Vé của tôi
                            </a>
                        )}

                        {currentUser ? (
                            <div className="user-account-box">
                                <span className="user-greeting">
                                    Xin chào,{" "}
                                    {currentUser.full_name ||
                                        currentUser.email}
                                </span>

                                <button
                                    type="button"
                                    className="btn-logout-mini"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={15} />
                                    Thoát
                                </button>
                            </div>
                        ) : (
                            <div className="auth-nav-actions">
                                <button
                                    type="button"
                                    className="btn-login-nav"
                                    onClick={() => openAuth("login")}
                                >
                                    <LogIn size={15} />
                                    Đăng nhập
                                </button>

                                <button
                                    type="button"
                                    className="btn-register-nav"
                                    onClick={() => openAuth("register")}
                                >
                                    Đăng ký
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn-admin-switch"
                            onClick={handleAdminAccess}
                        >
                            <ShieldCheck size={16} />
                            Trang Quản Trị
                        </button>
                    </nav>
                </div>
            </header>

            {/* HERO */}
            <section className="user-hero">
                <div className="user-hero-content">
                    <span className="hero-badge">
                        <Sparkles size={14} />
                        ĐẶT VÉ TRỰC TUYẾN NHANH CHÓNG
                    </span>

                    <h1>
                        Trải nghiệm điện ảnh sống động cùng TOON
                        CINEMA
                    </h1>

                    <p>
                        Chọn bộ phim yêu thích, giữ chỗ ngồi đẹp
                        nhất trong 30 giây và thưởng thức combo
                        bắp nước nóng hổi.
                    </p>

                    <a
                        href="#movies-section"
                        className="btn-primary-hero"
                    >
                        <Ticket size={18} />
                        Đặt vé ngay
                    </a>
                </div>
            </section>

            {/* DANH SÁCH PHIM */}
            <section
                id="movies-section"
                className="user-section"
            >
                <div className="section-head">
                    <div>
                        <h2>Danh Sách Phim</h2>
                        <p>
                            Chọn phim để xem lịch chiếu và đặt ghế
                        </p>
                    </div>

                    <div className="filter-tabs">
                        {[
                            "ALL",
                            "Đang chiếu",
                            "Sắp chiếu"
                        ].map((tab) => (
                            <button
                                key={tab}
                                className={`filter-tab ${
                                    statusFilter === tab
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setStatusFilter(tab)
                                }
                            >
                                {tab === "ALL"
                                    ? "Tất cả phim"
                                    : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        Đang tải danh sách phim...
                    </div>
                ) : filteredMovies.length === 0 ? (
                    <div className="empty-state">
                        Chưa có phim nào trong mục này.
                    </div>
                ) : (
                    <div className="movie-grid">
                        {filteredMovies.map((movie) => (
                            <div
                                key={movie.id}
                                className="movie-card"
                            >
                                <div className="movie-poster-wrap">
                                    <img
                                        src={
                                            movie.poster ||
                                            "https://placehold.co/400x560/8b5cf6/ffffff?text=TOON+CINEMA"
                                        }
                                        alt={movie.title}
                                    />

                                    <span className="movie-status-badge">
                                        {movie.status ||
                                            "Đang chiếu"}
                                    </span>
                                </div>

                                <div className="movie-card-body">
                                    <h3>{movie.title}</h3>

                                    <div className="movie-meta">
                                        <span>
                                            <Film size={14} />
                                            {movie.genre ||
                                                "Hoạt hình"}
                                        </span>

                                        <span>
                                            <Clock size={14} />
                                            {movie.duration || 120}{" "}
                                            phút
                                        </span>
                                    </div>

                                    <p className="movie-desc">
                                        {movie.description ||
                                            "Bộ phim đặc sắc đang được trình chiếu tại hệ thống rạp TOON CINEMA."}
                                    </p>

                                    <button
                                        className="btn-book-movie"
                                        onClick={() =>
                                            openMovieBooking(movie)
                                        }
                                    >
                                        <Ticket size={16} />
                                        Chọn suất & Đặt vé
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* VÉ CỦA TÔI */}
            {currentUser && (
                <section
                    id="my-tickets-section"
                    className="user-section"
                >
                    <div className="section-head">
                        <div>
                            <h2>Vé của tôi</h2>
                            <p>
                                Tra cứu mã vé và xem lại các vé đã
                                đặt bằng tài khoản này
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleTicketLookup}
                        style={{
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 20
                        }}
                    >
                        <input
                            value={ticketLookupCode}
                            onChange={(e) =>
                                setTicketLookupCode(e.target.value)
                            }
                            placeholder="Nhập mã vé, ví dụ TC-12AB34CD"
                            style={{
                                flex: "1 1 260px",
                                minWidth: 0,
                                padding: "13px 15px",
                                border: "1px solid #e5d9f7",
                                borderRadius: 12
                            }}
                        />

                        <button
                            className="btn-book-movie"
                            type="submit"
                            disabled={ticketLookupLoading}
                        >
                            {ticketLookupLoading
                                ? "Đang kiểm tra..."
                                : "Kiểm tra vé"}
                        </button>
                    </form>

                    {ticketLookupResult && (
                        <div
                            className="receipt-details"
                            style={{
                                background: "#f7f2ff",
                                padding: 18,
                                borderRadius: 14,
                                marginBottom: 18
                            }}
                        >
                            <div>
                                <span>Mã vé:</span>
                                <strong>
                                    {ticketLookupResult.ticket_code}
                                </strong>
                            </div>

                            <div>
                                <span>Phim:</span>
                                <strong>
                                    {ticketLookupResult.movie_title}
                                </strong>
                            </div>

                            <div>
                                <span>Phòng / Suất:</span>
                                <strong>
                                    {ticketLookupResult.room_name} —{" "}
                                    {new Date(
                                        ticketLookupResult.start_time
                                    ).toLocaleString("vi-VN")}
                                </strong>
                            </div>

                            <div>
                                <span>Ghế:</span>
                                <strong>
                                    {(
                                        ticketLookupResult.seats || []
                                    ).join(", ")}
                                </strong>
                            </div>

                            <div>
                                <span>Trạng thái:</span>
                                <strong>
                                    {ticketLookupResult.status ===
                                    "valid"
                                        ? "Hợp lệ"
                                        : ticketLookupResult.status}
                                </strong>
                            </div>
                        </div>
                    )}

                    {myTickets.length === 0 ? (
                        <div className="empty-state">
                            Bạn chưa có vé nào. Hãy chọn phim và
                            đặt vé nhé!
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: 14
                            }}
                        >
                            {myTickets.map((ticket) => (
                                <article
                                    key={ticket.id}
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #eee5fa",
                                        borderRadius: 16,
                                        padding: 18,
                                        boxShadow:
                                            "0 8px 24px rgba(80,50,120,.06)"
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            gap: 8,
                                            marginBottom: 10
                                        }}
                                    >
                                        <strong
                                            style={{
                                                color: "#7c3aed"
                                            }}
                                        >
                                            {ticket.ticket_code}
                                        </strong>

                                        <span
                                            style={{
                                                color:
                                                    ticket.status ===
                                                    "valid"
                                                        ? "#15803d"
                                                        : "#b45309",
                                                fontSize: 12,
                                                fontWeight: 700
                                            }}
                                        >
                                            {ticket.status === "valid"
                                                ? "HỢP LỆ"
                                                : String(
                                                      ticket.status
                                                  ).toUpperCase()}
                                        </span>
                                    </div>

                                    <h3
                                        style={{
                                            margin: "0 0 8px"
                                        }}
                                    >
                                        {ticket.movie_title}
                                    </h3>

                                    <p
                                        style={{
                                            margin: "5px 0",
                                            color: "#716782"
                                        }}
                                    >
                                        Phòng: {ticket.room_name}
                                    </p>

                                    <p
                                        style={{
                                            margin: "5px 0",
                                            color: "#716782"
                                        }}
                                    >
                                        Suất:{" "}
                                        {new Date(
                                            ticket.start_time
                                        ).toLocaleString("vi-VN")}
                                    </p>

                                    <p
                                        style={{
                                            margin: "5px 0",
                                            color: "#716782"
                                        }}
                                    >
                                        Ghế:{" "}
                                        {(ticket.seats || []).join(
                                            ", "
                                        )}
                                    </p>

                                    <strong>
                                        {Number(
                                            ticket.total
                                        ).toLocaleString("vi-VN")}{" "}
                                        đ
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTicketLookupCode(
                                                ticket.ticket_code
                                            );
                                            setTicketLookupResult(
                                                ticket
                                            );
                                        }}
                                        style={{
                                            display: "block",
                                            marginTop: 12,
                                            border: 0,
                                            borderRadius: 9,
                                            padding: "9px 13px",
                                            background: "#f1eaff",
                                            color: "#7135c5",
                                            fontWeight: 700,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Xem / kiểm tra vé
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* COMBO BẮP NƯỚC */}
            <section
                id="combos-section"
                className="user-section"
            >
                <div className="section-head">
                    <div>
                        <h2>Combo Bắp & Nước</h2>
                        <p>
                            Thêm ưu đãi bắp nước khi đặt vé xem phim
                        </p>
                    </div>
                </div>

                <div className="combo-grid">
                    {products.map((item) => (
                        <div
                            key={item.id}
                            className="combo-card"
                        >
                            <img
                                src={
                                    item.image ||
                                    "https://placehold.co/300x200/f3e8ff/7c3aed?text=POPCORN"
                                }
                                alt={item.name}
                            />

                            <div className="combo-info">
                                <h4>{item.name}</h4>

                                <strong className="combo-price">
                                    {Number(
                                        item.price
                                    ).toLocaleString("vi-VN")}{" "}
                                    đ
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ */}
            {authModal.open && (
                <div className="booking-modal-backdrop">
                    <div
                        className="booking-modal"
                        style={{ maxWidth: "420px" }}
                    >
                        <div className="booking-modal-header">
                            <div>
                                <h3>
                                    {authModal.mode === "login"
                                        ? "Đăng nhập TOON CINEMA"
                                        : "Đăng ký tài khoản"}
                                </h3>

                                <small>
                                    {authModal.mode === "login"
                                        ? "Nhập email và mật khẩu của bạn"
                                        : "Tạo tài khoản mới để đặt vé nhanh chóng"}
                                </small>
                            </div>

                            <button
                                type="button"
                                className="close-modal-btn"
                                onClick={closeAuth}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleAuthSubmit}
                            className="booking-modal-body"
                        >
                            {authMessage.text && (
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        marginBottom: "12px",
                                        fontSize: "14px",
                                        background:
                                            authMessage.type ===
                                            "error"
                                                ? "#fee2e2"
                                                : "#dcfce7",
                                        color:
                                            authMessage.type ===
                                            "error"
                                                ? "#991b1b"
                                                : "#166534"
                                    }}
                                >
                                    {authMessage.text}
                                </div>
                            )}

                            {authModal.mode === "register" && (
                                <div
                                    style={{
                                        marginBottom: "12px"
                                    }}
                                >
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "4px",
                                            fontWeight: 600
                                        }}
                                    >
                                        Họ và tên
                                    </label>

                                    <input
                                        type="text"
                                        className="customer-input"
                                        style={{ width: "100%" }}
                                        placeholder="Nguyễn Văn A"
                                        value={authForm.full_name}
                                        onChange={(e) =>
                                            setAuthForm((prev) => ({
                                                ...prev,
                                                full_name:
                                                    e.target.value
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            <div
                                style={{
                                    marginBottom: "12px"
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "4px",
                                        fontWeight: 600
                                    }}
                                >
                                    Email
                                </label>

                                <input
                                    type="email"
                                    className="customer-input"
                                    style={{ width: "100%" }}
                                    placeholder="example@gmail.com"
                                    value={authForm.email}
                                    onChange={(e) =>
                                        setAuthForm((prev) => ({
                                            ...prev,
                                            email: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <div
                                style={{
                                    marginBottom: "16px"
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "4px",
                                        fontWeight: 600
                                    }}
                                >
                                    Mật khẩu
                                </label>

                                <input
                                    type="password"
                                    className="customer-input"
                                    style={{ width: "100%" }}
                                    placeholder="••••••••"
                                    value={authForm.password}
                                    onChange={(e) =>
                                        setAuthForm((prev) => ({
                                            ...prev,
                                            password: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-book-movie"
                                style={{ width: "100%" }}
                                disabled={authSubmitting}
                            >
                                {authSubmitting
                                    ? "Đang xử lý..."
                                    : authModal.mode === "login"
                                    ? "Đăng nhập"
                                    : "Đăng ký"}
                            </button>

                            <div
                                style={{
                                    marginTop: "12px",
                                    textAlign: "center",
                                    fontSize: "13px"
                                }}
                            >
                                {authModal.mode === "login" ? (
                                    <span>
                                        Chưa có tài khoản?{" "}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openAuth("register")
                                            }
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#7c3aed",
                                                fontWeight: 600,
                                                cursor: "pointer"
                                            }}
                                        >
                                            Đăng ký ngay
                                        </button>
                                    </span>
                                ) : (
                                    <span>
                                        Đã có tài khoản?{" "}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openAuth("login")
                                            }
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#7c3aed",
                                                fontWeight: 600,
                                                cursor: "pointer"
                                            }}
                                        >
                                            Đăng nhập
                                        </button>
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ĐẶT VÉ */}
            {selectedMovie && (
                <div className="booking-modal-backdrop">
                    <div className="booking-modal">
                        <div className="booking-modal-header">
                            <div>
                                <h3>
                                    Đặt vé: {selectedMovie.title}
                                </h3>

                                <small>
                                    {selectedMovie.genre} •{" "}
                                    {selectedMovie.duration} phút
                                </small>
                            </div>

                            <button
                                className="close-modal-btn"
                                onClick={() =>
                                    setSelectedMovie(null)
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="booking-modal-body">
                            {ticketReceipt ? (
                                <div className="receipt-box">
                                    <CheckCircle2
                                        size={48}
                                        color="#16a34a"
                                    />

                                    <h3>Đặt vé thành công!</h3>

                                    <p>
                                        Mã vé của bạn:{" "}
                                        <strong>
                                            {ticketReceipt.code}
                                        </strong>
                                    </p>

                                    <div className="receipt-details">
                                        <div>
                                            <span>Khách hàng:</span>
                                            <strong>
                                                {ticketReceipt.customer}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Phim:</span>
                                            <strong>
                                                {ticketReceipt.movieTitle}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Phòng / Suất:</span>
                                            <strong>
                                                {ticketReceipt.roomName}{" "}
                                                —{" "}
                                                {new Date(
                                                    ticketReceipt.startTime
                                                ).toLocaleString("vi-VN")}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Ghế đã đặt:</span>
                                            <strong>
                                                {ticketReceipt.seats.join(
                                                    ", "
                                                )}
                                            </strong>
                                        </div>

                                        {ticketReceipt.combos.length >
                                            0 && (
                                            <div>
                                                <span>Bắp nước:</span>

                                                <strong>
                                                    {ticketReceipt.combos
                                                        .map(
                                                            (combo) =>
                                                                `${combo.name} (x${
                                                                    combo.quantity ??
                                                                    combo.qty
                                                                })`
                                                        )
                                                        .join(", ")}
                                                </strong>
                                            </div>
                                        )}

                                        <div className="receipt-total">
                                            <span>
                                                Tổng thanh toán:
                                            </span>

                                            <strong>
                                                {ticketReceipt.total.toLocaleString(
                                                    "vi-VN"
                                                )}{" "}
                                                đ
                                            </strong>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-book-movie"
                                        onClick={() =>
                                            setSelectedMovie(null)
                                        }
                                    >
                                        Hoàn tất
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* BƯỚC 1: CHỌN SUẤT CHIẾU */}
                                    <div className="booking-step">
                                        <h4>
                                            <Calendar size={16} />
                                            1. Chọn suất chiếu
                                        </h4>

                                        {movieShowtimes.length ===
                                        0 ? (
                                            <p className="muted-text">
                                                Phim này hiện chưa có
                                                lịch chiếu.
                                            </p>
                                        ) : (
                                            <div className="showtime-pills">
                                                {movieShowtimes.map(
                                                    (st) => (
                                                        <button
                                                            key={st.id}
                                                            className={`showtime-pill ${
                                                                selectedShowtime?.id ===
                                                                st.id
                                                                    ? "active"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                handleSelectShowtime(
                                                                    st
                                                                )
                                                            }
                                                        >
                                                            <strong>
                                                                {new Date(
                                                                    st.start_time
                                                                ).toLocaleTimeString(
                                                                    "vi-VN",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit"
                                                                    }
                                                                )}
                                                            </strong>

                                                            <span>
                                                                {new Date(
                                                                    st.start_time
                                                                ).toLocaleDateString(
                                                                    "vi-VN"
                                                                )}{" "}
                                                                •{" "}
                                                                {st.room_name}
                                                            </span>

                                                            <small>
                                                                {Number(
                                                                    st.price
                                                                ).toLocaleString(
                                                                    "vi-VN"
                                                                )}{" "}
                                                                đ/ghế
                                                            </small>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* BƯỚC 2: CHỌN GHẾ */}
                                    {selectedShowtime && (
                                        <div className="booking-step">
                                            <h4>
                                                <Ticket size={16} />
                                                2. Chọn ghế ngồi (
                                                {selectedShowtime.room_name}
                                                )
                                            </h4>

                                            <div className="screen-bar">
                                                MÀN HÌNH CHIẾU
                                            </div>

                                            <div className="user-seat-grid">
                                                {allSeats.map(
                                                    (seat) => {
                                                        const isBooked =
                                                            bookedSeats.includes(
                                                                seat
                                                            );

                                                        const isSelected =
                                                            selectedSeats.includes(
                                                                seat
                                                            );

                                                        return (
                                                            <button
                                                                key={seat}
                                                                disabled={
                                                                    isBooked
                                                                }
                                                                onClick={() =>
                                                                    toggleSeat(
                                                                        seat
                                                                    )
                                                                }
                                                                className={`user-seat ${
                                                                    isBooked
                                                                        ? "booked"
                                                                        : isSelected
                                                                        ? "selected"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {seat}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>

                                            <div className="seat-legend">
                                                <span>
                                                    <i className="dot free" />
                                                    Ghế trống
                                                </span>

                                                <span>
                                                    <i className="dot selected" />
                                                    Đang chọn
                                                </span>

                                                <span>
                                                    <i className="dot booked" />
                                                    Đã đặt
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* BƯỚC 3: CHỌN COMBO */}
                                    {selectedShowtime &&
                                        products.length > 0 && (
                                            <div className="booking-step">
                                                <h4>
                                                    <Popcorn size={16} />
                                                    3. Chọn thêm bắp
                                                    nước (Tùy chọn)
                                                </h4>

                                                <div className="modal-product-list">
                                                    {products.map(
                                                        (product) => {
                                                            const qty =
                                                                cartProducts[
                                                                    product.id
                                                                ] || 0;

                                                            return (
                                                                <div
                                                                    key={
                                                                        product.id
                                                                    }
                                                                    className="modal-product-row"
                                                                >
                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                product.name
                                                                            }
                                                                        </strong>

                                                                        <small>
                                                                            {Number(
                                                                                product.price
                                                                            ).toLocaleString(
                                                                                "vi-VN"
                                                                            )}{" "}
                                                                            đ
                                                                        </small>

                                                                        <small>
                                                                            Còn:{" "}
                                                                            {Number(
                                                                                product.quantity ??
                                                                                    0
                                                                            )}{" "}
                                                                            sản phẩm
                                                                        </small>
                                                                    </div>

                                                                    <div className="qty-controls">
                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                qty <=
                                                                                0
                                                                            }
                                                                            onClick={() =>
                                                                                updateProductQty(
                                                                                    product,
                                                                                    -1
                                                                                )
                                                                            }
                                                                        >
                                                                            -
                                                                        </button>

                                                                        <span>
                                                                            {
                                                                                qty
                                                                            }
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            disabled={
                                                                                qty >=
                                                                                Number(
                                                                                    product.quantity ??
                                                                                        0
                                                                                )
                                                                            }
                                                                            onClick={() =>
                                                                                updateProductQty(
                                                                                    product,
                                                                                    1
                                                                                )
                                                                            }
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* THANH TOÁN */}
                                    {selectedShowtime && (
                                        <div className="booking-checkout-bar">
                                            <input
                                                type="text"
                                                placeholder="Nhập tên của bạn (tùy chọn)..."
                                                value={customerName}
                                                onChange={(e) =>
                                                    setCustomerName(
                                                        e.target.value
                                                    )
                                                }
                                                className="customer-input"
                                            />

                                            <div className="checkout-summary">
                                                <div>
                                                    <small>
                                                        Ghế:{" "}
                                                        {selectedSeats.length >
                                                        0
                                                            ? selectedSeats.join(
                                                                  ", "
                                                              )
                                                            : "Chưa chọn"}
                                                    </small>

                                                    <strong>
                                                        Tổng:{" "}
                                                        {grandTotal.toLocaleString(
                                                            "vi-VN"
                                                        )}{" "}
                                                        đ
                                                    </strong>
                                                </div>

                                                <button
                                                    className="btn-confirm-pay"
                                                    disabled={
                                                        bookingLoading ||
                                                        selectedSeats.length ===
                                                            0
                                                    }
                                                    onClick={
                                                        handleConfirmBooking
                                                    }
                                                >
                                                    {bookingLoading
                                                        ? "Đang xử lý..."
                                                        : "Xác nhận đặt vé"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

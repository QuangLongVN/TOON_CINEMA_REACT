// ========================================
// TOON CINEMA - FRONTEND NEON POSTGRESQL
// ========================================

const API_URL = "/api";
const PRODUCT_STORAGE_KEY = "toon_cinema_products_v1";

const db = {
    movies: [],
    rooms: [],
    showtimes: [],
    products: [],
    bookedSeats: {}
};

// ========================================
// API
// ========================================

async function apiRequest(endpoint, options = {}) {
    let response;

    try {
        response = await fetch(API_URL + endpoint, options);
    } catch {
        throw new Error("Không thể kết nối đến backend!");
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Server trả về dữ liệu không hợp lệ!");
    }

    if (!response.ok) {
        throw new Error(data.message || "Yêu cầu thất bại!");
    }

    return data;
}

async function loadDatabase() {
    const [movies, rooms, showtimes] = await Promise.all([
        apiRequest("/movies"),
        apiRequest("/rooms"),
        apiRequest("/showtimes")
    ]);

    db.movies = movies.map(movie => ({
        id: Number(movie.MovieID),
        title: movie.Title,
        genre: movie.Genre,
        duration: Number(movie.Duration),
        poster: movie.ImageUrl
    }));

    db.rooms = rooms.map(room => ({
        id: Number(room.RoomID),
        name: room.RoomName,
        rows: Number(room.NumberOfRows || 10),
        columns: Number(room.SeatPerRow || 8)
    }));

    db.showtimes = showtimes.map(item => ({
        id: Number(item.ShowtimeID),
        movieId: Number(item.MovieID),
        roomId: Number(item.RoomID),
        startTime: item.StartTime,
        price: Number(item.TicketPrice)
    }));

    renderAll();
}

// ========================================
// LOCAL STORAGE - CHỈ DÀNH CHO SẢN PHẨM
// ========================================

function loadProducts() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(PRODUCT_STORAGE_KEY)
        );

        db.products = Array.isArray(saved) ? saved : [];
    } catch {
        db.products = [];
    }
}

function saveProducts() {
    localStorage.setItem(
        PRODUCT_STORAGE_KEY,
        JSON.stringify(db.products)
    );
}

function nextId(items) {
    return Math.max(
        0,
        ...items.map(item => Number(item.id) || 0)
    ) + 1;
}

// ========================================
// THÔNG BÁO
// ========================================

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 2500);
}

// ========================================
// CHUYỂN TRANG
// ========================================

const pageNames = {
    dashboard: "Tổng quan",
    movies: "Quản lý phim",
    rooms: "Phòng chiếu",
    showtimes: "Lịch chiếu",
    seats: "Quản lý ghế",
    products: "Sản phẩm"
};

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle(
            "active",
            page.id === pageId
        );
    });

    document.querySelectorAll(".menu-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    document.getElementById("breadcrumb").textContent =
        pageNames[pageId];

    document.getElementById("pageTitle").textContent =
        pageNames[pageId];

    renderAll();
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// ========================================
// MODAL
// ========================================

let modalSubmit = null;

function openModal(title, fields, onSubmit) {
    document.getElementById("modalTitle").textContent = title;

    const container = document.getElementById("modalFields");
    container.replaceChildren();

    fields.forEach(field => {
        const group = document.createElement("div");
        group.className = "form-group";

        const label = document.createElement("label");
        label.textContent = field.label;

        let input;

        if (field.type === "select") {
            input = document.createElement("select");

            field.options.forEach(option => {
                const el = document.createElement("option");

                el.value = option.value;
                el.textContent = option.text;

                input.appendChild(el);
            });
        } else {
            input = document.createElement("input");
            input.type = field.type || "text";

            if (field.type === "file") {
                input.accept = "image/jpeg,image/png,image/webp";
            }
        }

        input.id = "field_" + field.name;
        input.required = field.required !== false;

        if (
            field.value !== undefined &&
            field.type !== "file"
        ) {
            input.value = field.value;
        }

        group.append(label, input);
        container.appendChild(group);
    });

    modalSubmit = onSubmit;

    document
        .getElementById("modalOverlay")
        .classList.remove("hidden");
}

function closeModal() {
    document
        .getElementById("modalOverlay")
        .classList.add("hidden");

    modalSubmit = null;
}

document.getElementById("closeModal").onclick = closeModal;
document.getElementById("cancelModal").onclick = closeModal;

document
    .getElementById("modalForm")
    .addEventListener("submit", async event => {
        event.preventDefault();

        if (!modalSubmit) return;

        const values = {};

        document
            .querySelectorAll(
                "#modalFields input, #modalFields select"
            )
            .forEach(input => {
                values[input.id.replace("field_", "")] =
                    input.type === "file"
                        ? input.files[0]
                        : input.value;
            });

        const submitButton = document.querySelector(
            '#modalForm button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            await modalSubmit(values);

            closeModal();
            renderAll();

            showToast("Lưu thông tin thành công! ✨");
        } catch (error) {
            alert(error.message);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });

// ========================================
// QUẢN LÝ PHIM
// ========================================

function movieFields(movie = {}) {
    return [
        {
            name: "title",
            label: "Tên phim",
            value: movie.title || ""
        },
        {
            name: "genre",
            label: "Thể loại",
            value: movie.genre || ""
        },
        {
            name: "duration",
            label: "Thời lượng (phút)",
            type: "number",
            value: movie.duration || ""
        },
        {
            name: "poster",
            label: "Ảnh poster từ máy tính",
            type: "file",
            required: false
        }
    ];
}

function addMovie(movie = null) {
    openModal(
        movie ? "✏️ Chỉnh sửa phim" : "🎬 Thêm phim mới",
        movieFields(movie || {}),
        async values => {
            const title = values.title.trim();
            const genre = values.genre.trim();
            const duration = Number(values.duration);

            if (!title || !genre) {
                throw new Error(
                    "Vui lòng nhập tên phim và thể loại!"
                );
            }

            if (
                !Number.isInteger(duration) ||
                duration <= 0
            ) {
                throw new Error(
                    "Thời lượng phải lớn hơn 0!"
                );
            }

            const formData = new FormData();

            formData.append("title", title);
            formData.append("genre", genre);
            formData.append("duration", duration);

            if (values.poster) {
                formData.append("image", values.poster);
            }

            const endpoint = movie
                ? `/movies/${movie.id}`
                : "/movies";

            await apiRequest(endpoint, {
                method: movie ? "PUT" : "POST",
                body: formData
            });

            await loadDatabase();
        }
    );
}

document.getElementById("addMovieBtn").onclick = () => {
    addMovie();
};

function createMovieCard(movie, showActions = true) {
    const card = document.createElement("div");
    card.className = "movie-card";

    const poster = document.createElement("div");
    poster.className = "movie-poster";

    if (movie.poster) {
        const img = document.createElement("img");

        img.src = movie.poster;
        img.alt = movie.title;
        img.loading = "lazy";

        poster.appendChild(img);
    } else {
        poster.textContent = "🎬";
    }

    const title = document.createElement("h3");
    title.textContent = movie.title;

    const info = document.createElement("p");
    info.textContent =
        `${movie.genre} • ${movie.duration} phút`;

    card.append(poster, title, info);

    if (showActions) {
        const actions = document.createElement("div");
        actions.className = "card-actions";

        const edit = document.createElement("button");
        edit.className = "btn-edit";
        edit.textContent = "✏️ Sửa";

        edit.onclick = () => {
            addMovie(movie);
        };

        const remove = document.createElement("button");
        remove.className = "btn-delete";
        remove.textContent = "🗑️ Xóa";

        remove.onclick = async () => {
            if (
                db.showtimes.some(
                    item => item.movieId === movie.id
                )
            ) {
                alert(
                    "Phim đã có lịch chiếu. " +
                    "Hãy xóa lịch chiếu trước!"
                );
                return;
            }

            if (!confirm(`Xóa phim "${movie.title}"?`)) {
                return;
            }

            try {
                await apiRequest(`/movies/${movie.id}`, {
                    method: "DELETE"
                });

                await loadDatabase();

                showToast("Xóa phim thành công!");
            } catch (error) {
                alert(error.message);
            }
        };

        actions.append(edit, remove);
        card.appendChild(actions);
    }

    return card;
}

function renderMovies() {
    const keyword = document
        .getElementById("movieSearch")
        .value.trim()
        .toLowerCase();

    const list = document.getElementById("movieList");
    list.replaceChildren();

    const filtered = db.movies.filter(movie =>
        movie.title.toLowerCase().includes(keyword)
    );

    filtered.forEach(movie => {
        list.appendChild(createMovieCard(movie));
    });

    document.getElementById("movieCount").textContent =
        `${filtered.length} phim`;

    const recent = document.getElementById("recentMovies");
    recent.replaceChildren();

    db.movies.slice(0, 4).forEach(movie => {
        recent.appendChild(
            createMovieCard(movie, false)
        );
    });
}

document
    .getElementById("movieSearch")
    .addEventListener("input", renderMovies);

// ========================================
// QUẢN LÝ PHÒNG CHIẾU
// ========================================

document.getElementById("addRoomBtn").onclick = () => {
    openModal(
        "🏢 Thêm phòng chiếu",
        [
            {
                name: "name",
                label: "Tên phòng chiếu"
            }
        ],
        async values => {
            const name = values.name.trim();

            if (!name) {
                throw new Error(
                    "Vui lòng nhập tên phòng!"
                );
            }

            if (
                db.rooms.some(
                    room =>
                        room.name.toLowerCase() ===
                        name.toLowerCase()
                )
            ) {
                throw new Error(
                    "Tên phòng đã tồn tại!"
                );
            }

            await apiRequest("/rooms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    roomName: name
                })
            });

            await loadDatabase();
        }
    );
};

function renderRooms() {
    const list = document.getElementById("roomList");
    list.replaceChildren();

    db.rooms.forEach(room => {
        const card = document.createElement("div");
        card.className = "room-card";

        const icon = document.createElement("div");
        icon.className = "room-icon";
        icon.textContent = "🏢";

        const title = document.createElement("h3");
        title.textContent = room.name;

        const info = document.createElement("p");

        const rows = room.rows || 10;
        const columns = room.columns || 8;

        info.textContent =
            `${rows * columns} ghế • ` +
            `${rows} hàng × ${columns} ghế`;

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const edit = document.createElement("button");
        edit.className = "btn-edit";
        edit.textContent = "✏️ Sửa";

        edit.onclick = () => {
            alert(
                "Backend hiện chưa có API sửa phòng. " +
                "Cần bổ sung PUT /api/rooms/:id."
            );
        };

        const remove = document.createElement("button");
        remove.className = "btn-delete";
        remove.textContent = "🗑️ Xóa";

        remove.onclick = async () => {
            if (
                db.showtimes.some(
                    item => item.roomId === room.id
                )
            ) {
                alert(
                    "Phòng đang có lịch chiếu!"
                );
                return;
            }

            if (!confirm(`Xóa ${room.name}?`)) {
                return;
            }

            try {
                await apiRequest(`/rooms/${room.id}`, {
                    method: "DELETE"
                });

                await loadDatabase();

                showToast("Xóa phòng thành công!");
            } catch (error) {
                alert(error.message);
            }
        };

        actions.append(edit, remove);
        card.append(icon, title, info, actions);

        list.appendChild(card);
    });
}

// ========================================
// QUẢN LÝ LỊCH CHIẾU
// ========================================

document.getElementById("addShowtimeBtn").onclick = () => {
    if (!db.movies.length || !db.rooms.length) {
        alert(
            "Cần có phim và phòng chiếu trước!"
        );
        return;
    }

    openModal(
        "📅 Tạo lịch chiếu",
        [
            {
                name: "movieId",
                label: "Chọn phim",
                type: "select",
                options: db.movies.map(movie => ({
                    value: movie.id,
                    text: movie.title
                }))
            },
            {
                name: "roomId",
                label: "Chọn phòng",
                type: "select",
                options: db.rooms.map(room => ({
                    value: room.id,
                    text: room.name
                }))
            },
            {
                name: "startTime",
                label: "Ngày và giờ chiếu",
                type: "datetime-local"
            },
            {
                name: "price",
                label: "Giá vé (VNĐ)",
                type: "number"
            }
        ],
        async values => {
            const movieId = Number(values.movieId);
            const roomId = Number(values.roomId);
            const price = Number(values.price);

            const start = new Date(
                values.startTime
            ).getTime();

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                throw new Error(
                    "Giá vé không hợp lệ!"
                );
            }

            if (!Number.isFinite(start)) {
                throw new Error(
                    "Ngày giờ không hợp lệ!"
                );
            }

            const movie = db.movies.find(
                item => item.id === movieId
            );

            if (!movie) {
                throw new Error(
                    "Không tìm thấy phim!"
                );
            }

            const end =
                start + movie.duration * 60000;

            const conflict = db.showtimes.some(item => {
                if (item.roomId !== roomId) {
                    return false;
                }

                const otherMovie = db.movies.find(
                    m => m.id === item.movieId
                );

                if (!otherMovie) {
                    return false;
                }

                const otherStart = new Date(
                    item.startTime
                ).getTime();

                const otherEnd =
                    otherStart +
                    otherMovie.duration * 60000;

                return (
                    start < otherEnd &&
                    end > otherStart
                );
            });

            if (conflict) {
                throw new Error(
                    "Phòng đã có suất chiếu trùng thời gian!"
                );
            }

            await apiRequest("/showtimes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    movieId,
                    roomId,
                    startTime: new Date(
                        values.startTime
                    ).toISOString(),
                    ticketPrice: price
                })
            });

            await loadDatabase();
        }
    );
};

function renderShowtimes() {
    const list = document.getElementById(
        "showtimeList"
    );

    list.replaceChildren();

    db.showtimes.forEach(item => {
        const movie = db.movies.find(
            m => m.id === item.movieId
        );

        const room = db.rooms.find(
            r => r.id === item.roomId
        );

        if (!movie || !room) {
            return;
        }

        const row = document.createElement("div");
        row.className = "data-row";

        const info = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = movie.title;

        const details = document.createElement("p");

        details.textContent =
            `${room.name} • ` +
            `${new Date(item.startTime).toLocaleString("vi-VN")} • ` +
            `${item.price.toLocaleString("vi-VN")} VNĐ`;

        info.append(title, details);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const seats = document.createElement("button");
        seats.className = "btn btn-outline";
        seats.textContent = "💺 Ghế";

        seats.onclick = () => {
            showPage("seats");

            document.getElementById(
                "seatShowtime"
            ).value = String(item.id);

            renderSeats();
        };

        const remove = document.createElement("button");
        remove.className = "btn btn-outline";
        remove.textContent = "Xóa";

        remove.onclick = async () => {
            if (
                !confirm("Xóa lịch chiếu này?")
            ) {
                return;
            }

            try {
                await apiRequest(
                    `/showtimes/${item.id}`,
                    {
                        method: "DELETE"
                    }
                );

                delete db.bookedSeats[item.id];

                await loadDatabase();

                showToast(
                    "Xóa lịch chiếu thành công!"
                );
            } catch (error) {
                alert(error.message);
            }
        };

        actions.append(seats, remove);
        row.append(info, actions);

        list.appendChild(row);
    });
}

// ========================================
// QUẢN LÝ GHẾ
// ========================================

function renderSeatSelect() {
    const select = document.getElementById(
        "seatShowtime"
    );

    const previous = select.value;

    select.replaceChildren();

    db.showtimes.forEach(item => {
        const movie = db.movies.find(
            m => m.id === item.movieId
        );

        const room = db.rooms.find(
            r => r.id === item.roomId
        );

        if (!movie || !room) {
            return;
        }

        const option = document.createElement("option");

        option.value = item.id;

        option.textContent =
            `${movie.title} - ${room.name} - ` +
            new Date(
                item.startTime
            ).toLocaleString("vi-VN");

        select.appendChild(option);
    });

    if (
        db.showtimes.some(
            item => String(item.id) === previous
        )
    ) {
        select.value = previous;
    }
}

async function loadBookedSeats(showtimeId) {
    if (!showtimeId) {
        return null;
    }

    const data = await apiRequest(
        `/seats/${showtimeId}`
    );

    db.bookedSeats[showtimeId] =
        data.bookedSeats || [];

    return data;
}

async function renderSeats() {
    const select = document.getElementById(
        "seatShowtime"
    );

    const grid = document.getElementById(
        "seatGrid"
    );

    const showtimeId = select.value;

    grid.replaceChildren();

    if (!showtimeId) {
        document.getElementById(
            "freeSeats"
        ).textContent = "0";

        document.getElementById(
            "bookedSeats"
        ).textContent = "0";

        return;
    }

    try {
        const data = await loadBookedSeats(
            showtimeId
        );

        // Tránh hiển thị ghế của suất chiếu cũ
        // nếu người dùng đã chuyển sang suất khác.
        if (select.value !== showtimeId) {
            return;
        }

        const booked = data.bookedSeats || [];
        const rows = Number(data.rows) || 10;
        const columns = Number(data.columns) || 8;

        grid.replaceChildren();

        for (let row = 0; row < rows; row++) {
            const letter = String.fromCharCode(
                65 + row
            );

            const label = document.createElement(
                "div"
            );

            label.className = "seat-row-label";
            label.textContent = letter;

            grid.appendChild(label);

            for (
                let col = 1;
                col <= columns;
                col++
            ) {
                const seatName = letter + col;

                const button = document.createElement(
                    "button"
                );

                button.className =
                    booked.includes(seatName)
                        ? "seat booked"
                        : "seat free";

                button.textContent = seatName;

                if (booked.includes(seatName)) {
                    button.disabled = true;
                    button.title = "Ghế đã được đặt";
                } else {
                    button.onclick = async () => {
                        if (
                            !confirm(
                                `Đặt ghế ${seatName}?`
                            )
                        ) {
                            return;
                        }

                        button.disabled = true;

                        try {
                            await apiRequest(
                                "/seats/book",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body: JSON.stringify({
                                        showtimeId:
                                            Number(showtimeId),
                                        seatCode: seatName
                                    })
                                }
                            );

                            showToast(
                                `Đặt ghế ${seatName} thành công!`
                            );

                            await renderSeats();
                        } catch (error) {
                            alert(error.message);
                            await renderSeats();
                        }
                    };
                }

                grid.appendChild(button);
            }
        }

        document.getElementById(
            "bookedSeats"
        ).textContent = booked.length;

        document.getElementById(
            "freeSeats"
        ).textContent =
            rows * columns - booked.length;

    } catch (error) {
        console.error(
            "Không thể tải ghế:",
            error
        );

        grid.textContent =
            "Không thể tải sơ đồ ghế.";

        document.getElementById(
            "freeSeats"
        ).textContent = "0";

        document.getElementById(
            "bookedSeats"
        ).textContent = "0";
    }
}

document
    .getElementById("seatShowtime")
    .addEventListener("change", renderSeats);

// ========================================
// CRUD SẢN PHẨM - LOCAL STORAGE
// ========================================

document.getElementById("addProductBtn").onclick = () => {
    openModal(
        "📦 Thêm sản phẩm",
        [
            {
                name: "name",
                label: "Tên sản phẩm"
            }
        ],
        values => {
            const name = values.name.trim();

            if (!name) {
                throw new Error(
                    "Vui lòng nhập tên sản phẩm!"
                );
            }

            db.products.push({
                id: nextId(db.products),
                name
            });

            saveProducts();
        }
    );
};

function renderProducts() {
    const list = document.getElementById(
        "productList"
    );

    list.replaceChildren();

    db.products.forEach(product => {
        const row = document.createElement("div");
        row.className = "data-row";

        const info = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = product.name;

        const id = document.createElement("p");
        id.textContent =
            `Mã sản phẩm: ${product.id}`;

        info.append(name, id);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const edit = document.createElement("button");
        edit.className = "btn btn-outline";
        edit.textContent = "Sửa";

        edit.onclick = () => {
            openModal(
                "Sửa sản phẩm",
                [
                    {
                        name: "name",
                        label: "Tên sản phẩm",
                        value: product.name
                    }
                ],
                values => {
                    const newName =
                        values.name.trim();

                    if (!newName) {
                        throw new Error(
                            "Tên sản phẩm không được để trống!"
                        );
                    }

                    product.name = newName;
                    saveProducts();
                }
            );
        };

        const remove = document.createElement("button");
        remove.className = "btn btn-outline";
        remove.textContent = "Xóa";

        remove.onclick = () => {
            if (
                !confirm(
                    "Xóa sản phẩm này?"
                )
            ) {
                return;
            }

            db.products = db.products.filter(
                p => p.id !== product.id
            );

            saveProducts();
            renderAll();

            showToast(
                "Xóa sản phẩm thành công!"
            );
        };

        actions.append(edit, remove);
        row.append(info, actions);

        list.appendChild(row);
    });
}

// ========================================
// DASHBOARD
// ========================================

function renderDashboard() {
    document.getElementById(
        "statMovies"
    ).textContent = db.movies.length;

    document.getElementById(
        "statRooms"
    ).textContent = db.rooms.length;

    document.getElementById(
        "statShowtimes"
    ).textContent = db.showtimes.length;

    const totalSeats = db.rooms.reduce(
        (total, room) => {
            return total +
                (room.rows || 10) *
                (room.columns || 8);
        },
        0
    );

    document.getElementById(
        "statSeats"
    ).textContent = totalSeats;
}

// ========================================
// RENDER ALL
// ========================================

function renderAll() {
    renderDashboard();
    renderMovies();
    renderRooms();
    renderShowtimes();
    renderSeatSelect();
    renderSeats();
    renderProducts();
}

// ========================================
// KHỞI TẠO WEBSITE
// ========================================

async function initializeApp() {
    loadProducts();

    try {
        await loadDatabase();

        console.log(
            "TOON CINEMA đã tải dữ liệu từ Neon PostgreSQL!"
        );
    } catch (error) {
        console.error(
            "Lỗi tải dữ liệu:",
            error
        );

        renderAll();

        alert(
            "Không thể tải dữ liệu từ Neon PostgreSQL: " +
            error.message
        );
    }
}

initializeApp();
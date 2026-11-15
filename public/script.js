// ========================================
// TOON CINEMA - FRONTEND DEMO
// ========================================

const STORAGE_KEY = "toon_cinema_manager_v1";

const initialData = {
    movies: [],
    rooms: [
        { id: 1, name: "Phòng 1" },
        { id: 2, name: "Phòng 2" },
        { id: 3, name: "Phòng 3" }
    ],
    showtimes: [],
    products: [],
    bookedSeats: {}
};

let db;

try {
    db = JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialData;
} catch {
    db = structuredClone(initialData);
}

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
        alert("Không thể lưu dữ liệu. Ảnh có thể quá lớn!");
    }
}

function nextId(items) {
    return Math.max(0, ...items.map(item => item.id)) + 1;
}

function showToast(message) {
    const toast = document.getElementById("toast");

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
        page.classList.toggle("active", page.id === pageId);
    });

    document.querySelectorAll(".menu-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    document.getElementById("breadcrumb").textContent = pageNames[pageId];
    document.getElementById("pageTitle").textContent = pageNames[pageId];

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
                input.accept = "image/*";
            }
        }

        input.id = "field_" + field.name;
        input.required = field.required !== false;

        if (field.value !== undefined && field.type !== "file") {
            input.value = field.value;
        }

        group.append(label, input);
        container.appendChild(group);
    });

    modalSubmit = onSubmit;

    document.getElementById("modalOverlay").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modalOverlay").classList.add("hidden");
    modalSubmit = null;
}

document.getElementById("closeModal").onclick = closeModal;
document.getElementById("cancelModal").onclick = closeModal;

document.getElementById("modalForm").addEventListener("submit", async event => {
    event.preventDefault();

    const values = {};

    document.querySelectorAll("#modalFields input, #modalFields select")
        .forEach(input => {
            values[input.id.replace("field_", "")] =
                input.type === "file" ? input.files[0] : input.value;
        });

    try {
        await modalSubmit(values);
        closeModal();
        save();
        renderAll();
        showToast("Lưu thông tin thành công! ✨");
    } catch (error) {
        alert(error.message);
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
            value: movie.duration || "",
            required: true
        },
        {
            name: "poster",
            label: "Ảnh poster từ máy tính",
            type: "file",
            required: false
        }
    ];
}

function readImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);

        if (!file.type.startsWith("image/")) {
            return reject(new Error("Vui lòng chọn file hình ảnh!"));
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Không thể đọc ảnh!"));

        reader.readAsDataURL(file);
    });
}

function addMovie(movie = null) {
    openModal(
        movie ? "✏️ Chỉnh sửa phim" : "🎬 Thêm phim mới",
        movieFields(movie || {}),
        async values => {
            const duration = Number(values.duration);

            if (!Number.isInteger(duration) || duration <= 0) {
                throw new Error("Thời lượng phải lớn hơn 0!");
            }

            const poster = await readImage(values.poster);

            if (movie) {
                Object.assign(movie, {
                    title: values.title.trim(),
                    genre: values.genre.trim(),
                    duration,
                    poster: poster || movie.poster
                });
            } else {
                db.movies.push({
                    id: nextId(db.movies),
                    title: values.title.trim(),
                    genre: values.genre.trim(),
                    duration,
                    poster
                });
            }
        }
    );
}

document.getElementById("addMovieBtn").onclick = () => addMovie();

function createMovieCard(movie, showActions = true) {
    const card = document.createElement("div");
    card.className = "movie-card";

    const poster = document.createElement("div");
    poster.className = "movie-poster";

    if (movie.poster) {
        const img = document.createElement("img");
        img.src = movie.poster;
        img.alt = movie.title;
        poster.appendChild(img);
    } else {
        poster.textContent = "🎬";
    }

    const title = document.createElement("h3");
    title.textContent = movie.title;

    const info = document.createElement("p");
    info.textContent = `${movie.genre} • ${movie.duration} phút`;

    card.append(poster, title, info);

    if (showActions) {
        const actions = document.createElement("div");
        actions.className = "card-actions";

        const edit = document.createElement("button");
        edit.className = "btn-edit";
        edit.textContent = "✏️ Sửa";
        edit.onclick = () => addMovie(movie);

        const remove = document.createElement("button");
        remove.className = "btn-delete";
        remove.textContent = "🗑️ Xóa";

        remove.onclick = () => {
            if (db.showtimes.some(item => item.movieId === movie.id)) {
                alert("Phim đã có lịch chiếu. Hãy xóa lịch chiếu trước!");
                return;
            }

            if (!confirm(`Xóa phim "${movie.title}"?`)) return;

            db.movies = db.movies.filter(item => item.id !== movie.id);
            save();
            renderAll();
        };

        actions.append(edit, remove);
        card.appendChild(actions);
    }

    return card;
}

function renderMovies() {
    const keyword = document.getElementById("movieSearch")
        .value.trim().toLowerCase();

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

    db.movies.slice(-4).reverse().forEach(movie => {
        recent.appendChild(createMovieCard(movie, false));
    });
}

document.getElementById("movieSearch")
    .addEventListener("input", renderMovies);

// ========================================
// QUẢN LÝ PHÒNG
// ========================================

document.getElementById("addRoomBtn").onclick = () => {
    openModal("🏢 Thêm phòng chiếu", [
        { name: "name", label: "Tên phòng chiếu" }
    ], values => {
        const name = values.name.trim();

        if (db.rooms.some(room => room.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("Tên phòng đã tồn tại!");
        }

        db.rooms.push({
            id: nextId(db.rooms),
            name
        });
    });
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
        info.textContent = "80 ghế • 10 hàng × 8 ghế";

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const edit = document.createElement("button");
        edit.className = "btn-edit";
        edit.textContent = "✏️ Sửa";

        edit.onclick = () => {
            openModal("Sửa phòng chiếu", [
                { name: "name", label: "Tên phòng", value: room.name }
            ], values => {
                room.name = values.name.trim();
            });
        };

        const remove = document.createElement("button");
        remove.className = "btn-delete";
        remove.textContent = "🗑️ Xóa";

        remove.onclick = () => {
            if (db.showtimes.some(item => item.roomId === room.id)) {
                alert("Phòng đang có lịch chiếu!");
                return;
            }

            if (!confirm(`Xóa ${room.name}?`)) return;

            db.rooms = db.rooms.filter(item => item.id !== room.id);
            save();
            renderAll();
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
        alert("Cần có phim và phòng chiếu trước!");
        return;
    }

    openModal("📅 Tạo lịch chiếu", [
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
    ], values => {
        const price = Number(values.price);

        if (!Number.isFinite(price) || price < 0) {
            throw new Error("Giá vé không hợp lệ!");
        }

        const movieId = Number(values.movieId);
        const roomId = Number(values.roomId);
        const start = new Date(values.startTime).getTime();

        if (!Number.isFinite(start)) {
            throw new Error("Ngày giờ không hợp lệ!");
        }

        const movie = db.movies.find(item => item.id === movieId);
        const end = start + movie.duration * 60000;

        const conflict = db.showtimes.some(item => {
            if (item.roomId !== roomId) return false;

            const otherMovie = db.movies.find(m => m.id === item.movieId);
            const otherStart = new Date(item.startTime).getTime();
            const otherEnd = otherStart + otherMovie.duration * 60000;

            return start < otherEnd && end > otherStart;
        });

        if (conflict) {
            throw new Error("Phòng đã có suất chiếu trùng thời gian!");
        }

        db.showtimes.push({
            id: nextId(db.showtimes),
            movieId,
            roomId,
            startTime: values.startTime,
            price
        });
    });
};

function renderShowtimes() {
    const list = document.getElementById("showtimeList");
    list.replaceChildren();

    db.showtimes.forEach(item => {
        const movie = db.movies.find(m => m.id === item.movieId);
        const room = db.rooms.find(r => r.id === item.roomId);

        if (!movie || !room) return;

        const row = document.createElement("div");
        row.className = "data-row";

        const info = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = movie.title;

        const details = document.createElement("p");
        details.textContent =
            `${room.name} • ${new Date(item.startTime).toLocaleString("vi-VN")} • ` +
            `${item.price.toLocaleString("vi-VN")} VNĐ`;

        info.append(title, details);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const seats = document.createElement("button");
        seats.className = "btn btn-outline";
        seats.textContent = "💺 Ghế";
        seats.onclick = () => {
            showPage("seats");
            document.getElementById("seatShowtime").value = item.id;
            renderSeats();
        };

        const remove = document.createElement("button");
        remove.className = "btn btn-outline";
        remove.textContent = "Xóa";
        remove.onclick = () => {
            if (!confirm("Xóa lịch chiếu này?")) return;

            db.showtimes = db.showtimes.filter(s => s.id !== item.id);
            delete db.bookedSeats[item.id];

            save();
            renderAll();
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
    const select = document.getElementById("seatShowtime");
    const previous = select.value;

    select.replaceChildren();

    db.showtimes.forEach(item => {
        const movie = db.movies.find(m => m.id === item.movieId);
        const room = db.rooms.find(r => r.id === item.roomId);

        if (!movie || !room) return;

        const option = document.createElement("option");
        option.value = item.id;
        option.textContent =
            `${movie.title} - ${room.name} - ` +
            new Date(item.startTime).toLocaleString("vi-VN");

        select.appendChild(option);
    });

    if (db.showtimes.some(item => String(item.id) === previous)) {
        select.value = previous;
    }
}

function renderSeats() {
    const select = document.getElementById("seatShowtime");
    const grid = document.getElementById("seatGrid");
    const showtimeId = select.value;

    grid.replaceChildren();

    if (!showtimeId) {
        document.getElementById("freeSeats").textContent = "0";
        document.getElementById("bookedSeats").textContent = "0";
        return;
    }

    const booked = db.bookedSeats[showtimeId] || [];

    for (let row = 0; row < 10; row++) {
        const letter = String.fromCharCode(65 + row);

        const label = document.createElement("div");
        label.className = "seat-row-label";
        label.textContent = letter;
        grid.appendChild(label);

        for (let col = 1; col <= 8; col++) {
            const seatName = letter + col;

            const button = document.createElement("button");
            button.className = booked.includes(seatName)
                ? "seat booked"
                : "seat free";

            button.textContent = seatName;

            button.onclick = () => {
                const current = db.bookedSeats[showtimeId] || [];

                if (current.includes(seatName)) {
                    db.bookedSeats[showtimeId] =
                        current.filter(s => s !== seatName);
                } else {
                    db.bookedSeats[showtimeId] = [...current, seatName];
                }

                save();
                renderSeats();
            };

            grid.appendChild(button);
        }
    }

    document.getElementById("bookedSeats").textContent = booked.length;
    document.getElementById("freeSeats").textContent = 80 - booked.length;
}

document.getElementById("seatShowtime")
    .addEventListener("change", renderSeats);

// ========================================
// CRUD SẢN PHẨM
// ========================================

document.getElementById("addProductBtn").onclick = () => {
    openModal("📦 Thêm sản phẩm", [
        { name: "name", label: "Tên sản phẩm" }
    ], values => {
        db.products.push({
            id: nextId(db.products),
            name: values.name.trim()
        });
    });
};

function renderProducts() {
    const list = document.getElementById("productList");
    list.replaceChildren();

    db.products.forEach(product => {
        const row = document.createElement("div");
        row.className = "data-row";

        const info = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = product.name;

        const id = document.createElement("p");
        id.textContent = `Mã sản phẩm: ${product.id}`;

        info.append(name, id);

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const edit = document.createElement("button");
        edit.className = "btn btn-outline";
        edit.textContent = "Sửa";
        edit.onclick = () => {
            openModal("Sửa sản phẩm", [
                { name: "name", label: "Tên sản phẩm", value: product.name }
            ], values => {
                product.name = values.name.trim();
            });
        };

        const remove = document.createElement("button");
        remove.className = "btn btn-outline";
        remove.textContent = "Xóa";
        remove.onclick = () => {
            if (!confirm("Xóa sản phẩm này?")) return;

            db.products = db.products.filter(p => p.id !== product.id);
            save();
            renderAll();
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
    document.getElementById("statMovies").textContent = db.movies.length;
    document.getElementById("statRooms").textContent = db.rooms.length;
    document.getElementById("statShowtimes").textContent = db.showtimes.length;
    document.getElementById("statSeats").textContent = db.rooms.length * 80;
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

renderAll();
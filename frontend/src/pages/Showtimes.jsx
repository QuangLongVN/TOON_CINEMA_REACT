import { notify } from "../components/NotificationHost";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
    showtimeAPI,
    movieAPI,
    roomAPI
} from "../services/api";

const emptyForm = {
    movie_id: "",
    room_id: "",
    start_time: "",
    price: 75000
};

function toInputDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Showtimes() {
    const [showtimes, setShowtimes] = useState([]);
    const [movies, setMovies] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    async function loadData() {
        try {
            const [s, m, r] = await Promise.all([
                showtimeAPI.getAll(),
                movieAPI.getAll(),
                roomAPI.getAll()
            ]);

            setShowtimes(s.data);
            setMovies(m.data);
            setRooms(r.data);
        } catch {
            notify("Không thể tải dữ liệu suất chiếu.");
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function openCreate() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(item) {
        setForm({
            movie_id: item.movie_id,
            room_id: item.room_id,
            start_time: toInputDate(item.start_time),
            price: item.price
        });

        setEditingId(item.id);
        setShowForm(true);
    }

    async function saveShowtime(e) {
        e.preventDefault();

        const data = {
            movie_id: Number(form.movie_id),
            room_id: Number(form.room_id),
            start_time: form.start_time.replace("T", " "),
            price: Number(form.price)
        };

        try {
            if (editingId) {
                await showtimeAPI.update(editingId, data);
            } else {
                await showtimeAPI.create(data);
            }

            setShowForm(false);
            await loadData();
        } catch (err) {
            notify(err.response?.data?.message || "Lỗi lưu suất chiếu.");
        }
    }

    async function deleteShowtime(id) {
        if (!confirm("Xóa suất chiếu này?")) return;

        try {
            await showtimeAPI.delete(id);
            await loadData();
        } catch {
            notify("Không thể xóa suất chiếu.");
        }
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Danh sách suất chiếu</h3>
                    <p>Quản lý lịch chiếu phim</p>
                </div>

                <button className="btn-primary" onClick={openCreate}>
                    <Plus size={18} />
                    Thêm suất chiếu
                </button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Phim</th>
                            <th>Phòng</th>
                            <th>Thời gian</th>
                            <th>Giá vé</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {showtimes.map((item) => (
                            <tr key={item.id}>
                                <td>#{item.id}</td>
                                <td><strong>{item.movie_title}</strong></td>
                                <td>{item.room_name}</td>

                                <td>
                                    {new Date(item.start_time).toLocaleString(
                                        "vi-VN"
                                    )}
                                </td>

                                <td>
                                    {Number(item.price).toLocaleString("vi-VN")}đ
                                </td>

                                <td>
                                    <div className="actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => openEdit(item)}
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() =>
                                                deleteShowtime(item.id)
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {showtimes.length === 0 && (
                            <tr>
                                <td colSpan="6" className="empty">
                                    Chưa có suất chiếu.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>
                            {editingId
                                ? "Sửa suất chiếu"
                                : "Thêm suất chiếu"}
                        </h3>

                        <form onSubmit={saveShowtime}>
                            <label>Chọn phim</label>
                            <select
                                required
                                value={form.movie_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        movie_id: e.target.value
                                    })
                                }
                            >
                                <option value="">-- Chọn phim --</option>
                                {movies.map((movie) => (
                                    <option key={movie.id} value={movie.id}>
                                        {movie.title}
                                    </option>
                                ))}
                            </select>

                            <label>Chọn phòng</label>
                            <select
                                required
                                value={form.room_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        room_id: e.target.value
                                    })
                                }
                            >
                                <option value="">-- Chọn phòng --</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </select>

                            <label>Thời gian chiếu</label>
                            <input
                                type="datetime-local"
                                required
                                value={form.start_time}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        start_time: e.target.value
                                    })
                                }
                            />

                            <label>Giá vé</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={form.price}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        price: e.target.value
                                    })
                                }
                            />

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Hủy
                                </button>

                                <button className="btn-primary">
                                    Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
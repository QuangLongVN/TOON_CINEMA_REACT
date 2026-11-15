import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { movieAPI } from "../services/api";

const emptyForm = {
    title: "",
    genre: "",
    duration: "",
    description: "",
    poster: "",
    status: "Đang chiếu"
};

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    async function loadMovies() {
        try {
            const res = await movieAPI.getAll();
            setMovies(res.data);
            setError("");
        } catch {
            setError("Không thể tải danh sách phim.");
        }
    }

    useEffect(() => {
        loadMovies();
    }, []);

    function openCreate() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(movie) {
        setForm({
            title: movie.title || "",
            genre: movie.genre || "",
            duration: movie.duration ?? "",
            description: movie.description || "",
            poster: movie.poster || "",
            status: movie.status || "Đang chiếu"
        });

        setEditingId(movie.id);
        setShowForm(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const data = {
                ...form,
                duration: form.duration === ""
                    ? null
                    : Number(form.duration)
            };

            if (editingId) {
                await movieAPI.update(editingId, data);
            } else {
                await movieAPI.create(data);
            }

            setShowForm(false);
            setForm(emptyForm);
            await loadMovies();
        } catch (err) {
            alert(err.response?.data?.message || "Không thể lưu phim.");
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Bạn có chắc muốn xóa phim này?")) {
            return;
        }

        try {
            await movieAPI.delete(id);
            await loadMovies();
        } catch {
            alert("Không thể xóa phim.");
        }
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Danh sách phim</h3>
                    <p>Quản lý thông tin phim trong hệ thống</p>
                </div>

                <button className="btn-primary" onClick={openCreate}>
                    <Plus size={18} />
                    Thêm phim
                </button>
            </div>

            {error && <div className="alert">{error}</div>}

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Poster</th>
                            <th>Tên phim</th>
                            <th>Thể loại</th>
                            <th>Thời lượng</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {movies.map((movie) => (
                            <tr key={movie.id}>
                                <td>#{movie.id}</td>

                                <td>
                                    {movie.poster ? (
                                        <img
                                            className="poster"
                                            src={movie.poster}
                                            alt={movie.title}
                                        />
                                    ) : (
                                        <div className="poster-placeholder">
                                            🎬
                                        </div>
                                    )}
                                </td>

                                <td><strong>{movie.title}</strong></td>
                                <td>{movie.genre || "—"}</td>
                                <td>
                                    {movie.duration
                                        ? `${movie.duration} phút`
                                        : "—"}
                                </td>

                                <td>
                                    <span className="badge">
                                        {movie.status}
                                    </span>
                                </td>

                                <td>
                                    <div className="actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => openEdit(movie)}
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(movie.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {movies.length === 0 && (
                            <tr>
                                <td colSpan="7" className="empty">
                                    Chưa có phim nào.
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
                            {editingId ? "Sửa phim" : "Thêm phim mới"}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <label>Tên phim</label>
                            <input
                                required
                                value={form.title}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        title: e.target.value
                                    })
                                }
                            />

                            <label>Thể loại</label>
                            <input
                                value={form.genre}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        genre: e.target.value
                                    })
                                }
                            />

                            <label>Thời lượng (phút)</label>
                            <input
                                type="number"
                                min="1"
                                value={form.duration}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        duration: e.target.value
                                    })
                                }
                            />

                            <label>Link poster</label>
                            <input
                                value={form.poster}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        poster: e.target.value
                                    })
                                }
                            />

                            <label>Mô tả</label>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value
                                    })
                                }
                            />

                            <label>Trạng thái</label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        status: e.target.value
                                    })
                                }
                            >
                                <option>Đang chiếu</option>
                                <option>Sắp chiếu</option>
                                <option>Ngừng chiếu</option>
                            </select>

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
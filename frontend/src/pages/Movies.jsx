import { notify } from "../components/NotificationHost";
import { useEffect, useState } from "react";
import { movieAPI } from "../services/api";

const initialForm = {
    title: "",
    genre: "",
    duration: "",
    status: "Đang chiếu"
};

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingMovie, setEditingMovie] = useState(null);

    const [form, setForm] = useState(initialForm);
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState("");

    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const loadMovies = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await movieAPI.getAll();

            setMovies(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (err) {
            console.error("Lỗi tải phim:", err);
            setError("Không thể tải danh sách phim.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMovies();
    }, []);

    const openAddModal = () => {
        setEditingMovie(null);
        setForm({ ...initialForm });
        setPosterFile(null);
        setPosterPreview("");
        setShowModal(true);
    };

    const openEditModal = (movie) => {
        setEditingMovie(movie);

        setForm({
            title: movie.title || "",
            genre: movie.genre || "",
            duration: movie.duration || "",
            status: movie.status || "Đang chiếu"
        });

        setPosterFile(null);
        setPosterPreview(movie.poster || "");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingMovie(null);
        setForm({ ...initialForm });
        setPosterFile(null);
        setPosterPreview("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePosterChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            notify("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            notify("Dung lượng poster không được vượt quá 5MB.");
            e.target.value = "";
            return;
        }

        setPosterFile(file);

        const reader = new FileReader();

        reader.onload = () => {
            setPosterPreview(reader.result);
        };

        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (saving) return;

        if (!form.title.trim()) {
            notify("Vui lòng nhập tên phim.");
            return;
        }

        if (!editingMovie && !posterFile) {
            notify("Vui lòng chọn ảnh poster.");
            return;
        }

        const duration = Number(form.duration);

        if (
            form.duration !== "" &&
            (!Number.isInteger(duration) || duration <= 0)
        ) {
            notify("Thời lượng phim phải là số nguyên lớn hơn 0.");
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();

            formData.append("title", form.title.trim());
            formData.append("genre", form.genre.trim());
            formData.append("duration", form.duration);
            formData.append("status", form.status);

            if (posterFile) {
                formData.append("poster", posterFile);
            }

            if (editingMovie) {
                await movieAPI.update(editingMovie.id, formData);
                notify("Cập nhật phim thành công!");
            } else {
                await movieAPI.create(formData);
                notify("Thêm phim thành công!");
            }

            setShowModal(false);
            setEditingMovie(null);
            setForm({ ...initialForm });
            setPosterFile(null);
            setPosterPreview("");

            await loadMovies();
        } catch (err) {
            console.error("Lỗi lưu phim:", err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Không thể lưu phim.";

            notify(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (movie) => {
        if (String(movie.status || "").trim().toLowerCase() === "đang chiếu") {
            notify(`Không thể xóa phim "${movie.title}" vì phim đang chiếu.`, "warning");
            return;
        }

        if (
            !window.confirm(
                `Bạn có chắc chắn muốn xóa phim "${movie.title}"?`
            )
        ) {
            return;
        }

        try {
            await movieAPI.delete(movie.id);
            notify("Xóa phim thành công!");
            await loadMovies();
        } catch (err) {
            console.error("Lỗi xóa phim:", err);

            notify(
                err.response?.data?.message ||
                "Không thể xóa phim."
            );
        }
    };

    const filteredMovies = movies.filter((movie) => {
        const keyword = search.toLowerCase().trim();

        return (
            String(movie.title || "")
                .toLowerCase()
                .includes(keyword) ||
            String(movie.genre || "")
                .toLowerCase()
                .includes(keyword)
        );
    });

    return (
        <div className="movies-page">
            <style>{`
                .movies-page {
                    padding: 28px;
                    color: #25213d;
                }

                .movies-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 26px;
                }

                .movies-header h1 {
                    margin: 0;
                    font-size: 27px;
                    font-weight: 800;
                }

                .movies-add-btn {
                    border: none;
                    border-radius: 12px;
                    padding: 13px 20px;
                    background: linear-gradient(
                        135deg,
                        #8554ef,
                        #b46be9
                    );
                    color: white;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                }

                .movies-card {
                    background: white;
                    border: 1px solid #eee8f7;
                    border-radius: 18px;
                    padding: 25px;
                    overflow-x: auto;
                }

                .movies-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .movies-card-header h2 {
                    margin: 0 0 8px;
                    font-size: 21px;
                }

                .movies-card-header p {
                    margin: 0;
                    color: #9a91ae;
                    font-size: 14px;
                }

                .movies-search {
                    padding: 12px 16px;
                    border: 1px solid #e6dff1;
                    border-radius: 10px;
                    outline: none;
                    width: 250px;
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .movies-search:focus {
                    border-color: #a56af0;
                }

                .movies-table {
                    width: 100%;
                    min-width: 720px;
                    border-collapse: collapse;
                }

                .movies-table th {
                    padding: 16px;
                    text-align: left;
                    background: #faf8ff;
                    color: #77708e;
                    font-size: 14px;
                }

                .movies-table td {
                    padding: 16px;
                    border-bottom: 1px solid #f0edf6;
                    vertical-align: middle;
                }

                .movies-poster {
                    width: 65px;
                    height: 90px;
                    object-fit: cover;
                    border-radius: 9px;
                    background: #f1eafb;
                }

                .movies-no-poster {
                    width: 65px;
                    height: 90px;
                    background: #f1eafb;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                }

                .movies-status {
                    display: inline-block;
                    padding: 7px 12px;
                    border-radius: 20px;
                    background: #e9f9ef;
                    color: #269956;
                    font-size: 13px;
                    font-weight: 600;
                }

                .movies-status.upcoming {
                    background: #fff2de;
                    color: #c7851d;
                }

                .movies-status.stopped {
                    background: #f1f1f1;
                    color: #777;
                }

                .movies-action {
                    border: none;
                    border-radius: 8px;
                    padding: 9px 13px;
                    cursor: pointer;
                    margin-right: 7px;
                    font-weight: 600;
                }

                .movies-edit {
                    background: #eee6ff;
                    color: #7844d8;
                }

                .movies-delete {
                    background: #ffe8e8;
                    color: #e14d4d;
                }

                .movies-error {
                    background: #fff0f0;
                    color: #df3838;
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 20px;
                }

                .movies-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(30, 22, 49, 0.55);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .movies-modal {
                    background: white;
                    width: 650px;
                    max-width: 100%;
                    max-height: 92vh;
                    overflow-y: auto;
                    padding: 36px;
                    border-radius: 22px;
                    box-sizing: border-box;
                }

                .movies-modal h2 {
                    margin: 0 0 28px;
                    font-size: 23px;
                }

                .movies-form-group {
                    margin-bottom: 22px;
                }

                .movies-form-group label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: 700;
                    color: #645a7a;
                }

                .movies-form-group input,
                .movies-form-group select {
                    width: 100%;
                    height: 56px;
                    padding: 0 18px;
                    border: 1px solid #e3d9f1;
                    border-radius: 12px;
                    box-sizing: border-box;
                    font-size: 16px;
                    background: white;
                    color: #302844;
                    outline: none;
                }

                .movies-form-group input:focus,
                .movies-form-group select:focus {
                    border-color: #a56af0;
                }

                .movies-upload-box {
                    border: 2px dashed #d9c6f5;
                    border-radius: 14px;
                    padding: 25px;
                    background: #fcfaff;
                    text-align: center;
                }

                .movies-upload-box input {
                    height: auto;
                    padding: 10px;
                }

                .movies-upload-note {
                    margin-top: 12px;
                    color: #9488a8;
                    font-size: 13px;
                }

                .movies-preview {
                    width: 150px;
                    height: 210px;
                    object-fit: cover;
                    border-radius: 12px;
                    margin-top: 18px;
                    border: 1px solid #e8dff4;
                }

                .movies-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 14px;
                    margin-top: 30px;
                }

                .movies-cancel-btn {
                    padding: 13px 24px;
                    background: white;
                    border: 1px solid #e3d9f1;
                    color: #6f6485;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .movies-save-btn {
                    padding: 13px 25px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(
                        135deg,
                        #8554ef,
                        #b46be9
                    );
                    color: white;
                    font-weight: 700;
                    cursor: pointer;
                }

                .movies-save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @media (max-width: 600px) {
                    .movies-page {
                        padding: 15px;
                    }

                    .movies-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .movies-card {
                        padding: 15px;
                    }

                    .movies-modal {
                        padding: 22px;
                    }
                }
            `}</style>

            <div className="movies-header">
                <h1>Quản lý phim</h1>

                <button
                    className="movies-add-btn"
                    onClick={openAddModal}
                >
                    + Thêm phim mới
                </button>
            </div>

            {error && (
                <div className="movies-error">
                    {error}
                </div>
            )}

            <div className="movies-card">
                <div className="movies-card-header">
                    <div>
                        <h2>Danh sách phim</h2>
                        <p>Quản lý thông tin phim trong hệ thống.</p>
                    </div>

                    <input
                        className="movies-search"
                        type="text"
                        placeholder="Tìm kiếm phim..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="movies-table">
                    <thead>
                        <tr>
                            <th>Poster</th>
                            <th>Tên phim</th>
                            <th>Thể loại</th>
                            <th>Thời lượng</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" align="center">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : filteredMovies.length === 0 ? (
                            <tr>
                                <td colSpan="6" align="center">
                                    Không tìm thấy phim.
                                </td>
                            </tr>
                        ) : (
                            filteredMovies.map((movie) => (
                                <tr key={movie.id}>
                                    <td>
                                        {movie.poster ? (
                                            <img
                                                src={movie.poster}
                                                alt={movie.title}
                                                className="movies-poster"
                                            />
                                        ) : (
                                            <div className="movies-no-poster">
                                                🎬
                                            </div>
                                        )}
                                    </td>

                                    <td>
                                        <strong>{movie.title}</strong>
                                    </td>

                                    <td>
                                        {movie.genre || "—"}
                                    </td>

                                    <td>
                                        {movie.duration
                                            ? `${movie.duration} phút`
                                            : "—"}
                                    </td>

                                    <td>
                                        <span
                                            className={`movies-status ${
                                                movie.status === "Sắp chiếu"
                                                    ? "upcoming"
                                                    : movie.status === "Ngừng chiếu"
                                                    ? "stopped"
                                                    : ""
                                            }`}
                                        >
                                            {movie.status || "Đang chiếu"}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            className="movies-action movies-edit"
                                            onClick={() => openEditModal(movie)}
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            className="movies-action movies-delete"
                                            onClick={() => handleDelete(movie)}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div
                    className="movies-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="movies-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>
                            {editingMovie
                                ? "Chỉnh sửa phim"
                                : "Thêm phim mới"}
                        </h2>

                        <form onSubmit={handleSave}>
                            <div className="movies-form-group">
                                <label>Tên phim</label>

                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="movies-form-group">
                                <label>Thể loại</label>

                                <input
                                    type="text"
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="movies-form-group">
                                <label>Thời lượng (phút)</label>

                                <input
                                    type="number"
                                    name="duration"
                                    min="1"
                                    value={form.duration}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="movies-form-group">
                                <label>Poster phim</label>

                                <div className="movies-upload-box">
                                    <div
                                        style={{
                                            fontSize: "35px",
                                            marginBottom: "10px"
                                        }}
                                    >
                                        📁
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePosterChange}
                                    />

                                    <div className="movies-upload-note">
                                        Chọn ảnh JPG, PNG hoặc WEBP.
                                        Tối đa 5MB.
                                    </div>

                                    {posterPreview && (
                                        <div>
                                            <img
                                                src={posterPreview}
                                                alt="Xem trước poster"
                                                className="movies-preview"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="movies-form-group">
                                <label>Trạng thái</label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="Đang chiếu">
                                        Đang chiếu
                                    </option>

                                    <option value="Sắp chiếu">
                                        Sắp chiếu
                                    </option>

                                    <option value="Ngừng chiếu">
                                        Ngừng chiếu
                                    </option>
                                </select>
                            </div>

                            <div className="movies-modal-actions">
                                <button
                                    type="button"
                                    className="movies-cancel-btn"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="movies-save-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : editingMovie
                                        ? "Cập nhật"
                                        : "Lưu phim"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
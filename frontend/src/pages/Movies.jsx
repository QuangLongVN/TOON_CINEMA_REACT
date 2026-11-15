import { useEffect, useState } from "react";
import { movieAPI } from "../services/api";

const emptyForm = {
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

    const [form, setForm] = useState(emptyForm);
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState("");

    const [saving, setSaving] = useState(false);

    const loadMovies = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await movieAPI.getAll();

            setMovies(response.data);
        } catch (err) {
            console.error(err);
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
        setForm({ ...emptyForm });
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
        setShowModal(false);
        setEditingMovie(null);
        setForm({ ...emptyForm });
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

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowed.includes(file.type)) {
            alert("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Ảnh không được vượt quá 5MB.");
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

        if (!form.title.trim()) {
            alert("Vui lòng nhập tên phim.");
            return;
        }

        if (!editingMovie && !posterFile) {
            alert("Vui lòng tải poster phim.");
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();

            formData.append("title", form.title.trim());
            formData.append("genre", form.genre);
            formData.append("duration", form.duration);
            formData.append("status", form.status);

            if (posterFile) {
                formData.append("poster", posterFile);
            }

            if (editingMovie) {
                await movieAPI.update(
                    editingMovie.id,
                    formData
                );

                alert("Cập nhật phim thành công!");
            } else {
                await movieAPI.create(formData);

                alert("Thêm phim thành công!");
            }

            closeModal();
            await loadMovies();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Không thể lưu phim."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (movie) => {
        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa phim "${movie.title}"?`
        );

        if (!confirmed) return;

        try {
            await movieAPI.delete(movie.id);

            alert("Xóa phim thành công!");
            await loadMovies();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Không thể xóa phim."
            );
        }
    };

    return (
        <div className="movies-page">
            <style>{`
                .movies-page {
                    padding: 28px;
                    color: #25213d;
                }

                .movies-heading {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 26px;
                }

                .movies-heading h1 {
                    margin: 0;
                    font-size: 27px;
                    font-weight: 800;
                }

                .movies-add-btn {
                    background: linear-gradient(
                        135deg,
                        #8554ef,
                        #b46be9
                    );
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 13px 20px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .movies-card {
                    background: white;
                    border: 1px solid #eee8f7;
                    border-radius: 18px;
                    padding: 25px;
                    overflow-x: auto;
                }

                .movies-card h2 {
                    margin: 0 0 8px;
                    font-size: 21px;
                }

                .movies-card p {
                    color: #9a91ae;
                    margin-bottom: 25px;
                }

                .movies-table {
                    width: 100%;
                    min-width: 700px;
                    border-collapse: collapse;
                }

                .movies-table th {
                    text-align: left;
                    padding: 16px;
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

                .movies-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(30, 22, 49, 0.55);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }

                .movies-modal {
                    background: white;
                    border-radius: 22px;
                    width: 650px;
                    max-width: 100%;
                    max-height: 92vh;
                    overflow-y: auto;
                    padding: 36px;
                    box-sizing: border-box;
                }

                .movies-modal h2 {
                    margin: 0 0 28px;
                    font-size: 23px;
                    color: #25213d;
                }

                .movies-form-group {
                    margin-bottom: 22px;
                }

                .movies-form-group label {
                    display: block;
                    font-weight: 700;
                    color: #645a7a;
                    margin-bottom: 10px;
                }

                .movies-form-group input,
                .movies-form-group select {
                    width: 100%;
                    height: 56px;
                    border: 1px solid #e3d9f1;
                    border-radius: 12px;
                    padding: 0 18px;
                    box-sizing: border-box;
                    font-size: 16px;
                    color: #302844;
                    background: white;
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
                    text-align: center;
                    background: #fcfaff;
                }

                .movies-upload-box input {
                    height: auto;
                    padding: 10px;
                    max-width: 100%;
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
                    background: white;
                    border: 1px solid #e3d9f1;
                    color: #6f6485;
                    border-radius: 12px;
                    padding: 13px 24px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .movies-save-btn {
                    background: linear-gradient(
                        135deg,
                        #8554ef,
                        #b46be9
                    );
                    border: none;
                    color: white;
                    border-radius: 12px;
                    padding: 13px 25px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .movies-save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .movies-error {
                    padding: 15px;
                    border-radius: 10px;
                    background: #fff0f0;
                    color: #df3838;
                    margin-bottom: 20px;
                }
            `}</style>

            <div className="movies-heading">
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
                <h2>Danh sách phim</h2>

                <p>
                    Quản lý thông tin phim trong hệ thống.
                </p>

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
                        ) : movies.length === 0 ? (
                            <tr>
                                <td colSpan="6" align="center">
                                    Chưa có phim nào.
                                </td>
                            </tr>
                        ) : (
                            movies.map((movie) => (
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
                                        <strong>
                                            {movie.title}
                                        </strong>
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
                                                    : ""
                                            }`}
                                        >
                                            {movie.status}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            className="movies-action movies-edit"
                                            onClick={() =>
                                                openEditModal(movie)
                                            }
                                        >
                                            Sửa
                                        </button>

                                        <button
                                            className="movies-action movies-delete"
                                            onClick={() =>
                                                handleDelete(movie)
                                            }
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
                                <label>Tải poster phim</label>

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
                                        : "Lưu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
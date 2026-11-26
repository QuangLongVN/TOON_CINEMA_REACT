import { notify } from "../components/NotificationHost";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { roomAPI } from "../services/api";

export default function Rooms() {
    const [rooms, setRooms] = useState([]);

    const [form, setForm] = useState({
        name: ""
    });

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    async function loadRooms() {
        try {
            const res = await roomAPI.getAll();
            setRooms(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Lỗi tải phòng:", error);
            notify("Không thể tải danh sách phòng chiếu.");
        }
    }

    useEffect(() => {
        loadRooms();
    }, []);

    function openCreate() {
        setEditingId(null);
        setForm({ name: "" });
        setShowForm(true);
    }

    function openEdit(room) {
        setEditingId(room.id);
        setForm({ name: room.name || "" });
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm({ name: "" });
    }

    async function saveRoom(e) {
        e.preventDefault();

        if (saving) return;

        const name = form.name.trim();

        if (!name) {
            notify("Vui lòng nhập tên phòng.");
            return;
        }

        const data = {
            name,
            total_seats: 80
        };

        try {
            setSaving(true);

            if (editingId !== null) {
                await roomAPI.update(editingId, data);
                notify("Cập nhật phòng thành công!");
            } else {
                await roomAPI.create(data);
                notify("Thêm phòng thành công!");
            }

            closeFormAfterSave();
            await loadRooms();

        } catch (error) {
            console.error("Lỗi lưu phòng:", error);

            notify(
                error.response?.data?.message ||
                "Không thể lưu phòng chiếu."
            );
        } finally {
            setSaving(false);
        }
    }

    function closeFormAfterSave() {
        setShowForm(false);
        setEditingId(null);
        setForm({ name: "" });
    }

    async function deleteRoom(id) {
        if (!window.confirm("Bạn có chắc muốn xóa phòng chiếu này?")) {
            return;
        }

        try {
            await roomAPI.delete(id);
            notify("Xóa phòng thành công!");
            await loadRooms();
        } catch (error) {
            console.error("Lỗi xóa phòng:", error);

            notify(
                error.response?.data?.message ||
                "Không thể xóa phòng chiếu."
            );
        }
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Danh sách phòng chiếu</h3>
                    <p>Quản lý các phòng trong rạp</p>
                </div>

                <button
                    className="btn-primary"
                    onClick={openCreate}
                >
                    <Plus size={18} />
                    Thêm phòng
                </button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên phòng</th>
                            <th>Số ghế</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rooms.map((room) => (
                            <tr key={room.id}>
                                <td>#{room.id}</td>

                                <td>
                                    <strong>{room.name}</strong>
                                </td>

                                <td>80 ghế</td>

                                <td>
                                    <div className="actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => openEdit(room)}
                                            title="Sửa phòng"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => deleteRoom(room.id)}
                                            title="Xóa phòng"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {rooms.length === 0 && (
                            <tr>
                                <td colSpan="4" className="empty">
                                    Chưa có phòng chiếu.
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
                            {editingId !== null
                                ? "Sửa phòng"
                                : "Thêm phòng"}
                        </h3>

                        <form onSubmit={saveRoom}>
                            <label>Tên phòng</label>

                            <input
                                type="text"
                                required
                                placeholder="Nhập tên phòng chiếu"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value
                                    })
                                }
                            />

                            <p
                                style={{
                                    marginTop: "12px",
                                    color: "#8b7ba5",
                                    fontSize: "14px"
                                }}
                            >
                                Mỗi phòng mặc định có 80 ghế.
                            </p>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeForm}
                                    disabled={saving}
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Đang lưu..." : "Lưu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
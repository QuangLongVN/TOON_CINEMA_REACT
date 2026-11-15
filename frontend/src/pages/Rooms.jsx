import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { roomAPI } from "../services/api";

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState({
        name: "",
        total_seats: 80
    });

    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    async function loadRooms() {
        try {
            const res = await roomAPI.getAll();
            setRooms(res.data);
        } catch {
            alert("Không thể tải phòng chiếu.");
        }
    }

    useEffect(() => {
        loadRooms();
    }, []);

    function openCreate() {
        setEditingId(null);
        setForm({ name: "", total_seats: 80 });
        setShowForm(true);
    }

    function openEdit(room) {
        setEditingId(room.id);
        setForm({
            name: room.name,
            total_seats: room.total_seats
        });
        setShowForm(true);
    }

    async function saveRoom(e) {
        e.preventDefault();

        try {
            if (editingId) {
                await roomAPI.update(editingId, form);
            } else {
                await roomAPI.create(form);
            }

            setShowForm(false);
            await loadRooms();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi lưu phòng.");
        }
    }

    async function deleteRoom(id) {
        if (!confirm("Xóa phòng chiếu này?")) return;

        try {
            await roomAPI.delete(id);
            await loadRooms();
        } catch {
            alert("Không thể xóa phòng.");
        }
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Danh sách phòng chiếu</h3>
                    <p>Quản lý các phòng trong rạp</p>
                </div>

                <button className="btn-primary" onClick={openCreate}>
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
                                <td><strong>{room.name}</strong></td>
                                <td>{room.total_seats} ghế</td>

                                <td>
                                    <div className="actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => openEdit(room)}
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => deleteRoom(room.id)}
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
                            {editingId ? "Sửa phòng" : "Thêm phòng"}
                        </h3>

                        <form onSubmit={saveRoom}>
                            <label>Tên phòng</label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        name: e.target.value
                                    })
                                }
                            />

                            <label>Số ghế</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={form.total_seats}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        total_seats: Number(e.target.value)
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
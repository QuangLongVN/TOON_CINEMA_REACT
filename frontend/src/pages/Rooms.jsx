import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { roomAPI } from "../services/api";

export default function Rooms() {
    const [rooms, setRooms] = useState([]);

    const [form, setForm] = useState({
        name: "",
        total_seats: ""
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
            alert("Không thể tải phòng chiếu.");
        }
    }

    useEffect(() => {
        loadRooms();
    }, []);

    function openCreate() {
        setEditingId(null);

        setForm({
            name: "",
            total_seats: ""
        });

        setShowForm(true);
    }

    function openEdit(room) {
        setEditingId(room.id);

        setForm({
            name: room.name || "",
            total_seats: String(room.total_seats ?? "")
        });

        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
    }

    async function saveRoom(e) {
        e.preventDefault();

        const name = form.name.trim();
        const seats = Number(form.total_seats);

        if (!name) {
            alert("Vui lòng nhập tên phòng.");
            return;
        }

        if (
            form.total_seats === "" ||
            !Number.isInteger(seats) ||
            seats <= 0
        ) {
            alert("Số ghế phải là số nguyên lớn hơn 0.");
            return;
        }

        const data = {
            name: name,
            total_seats: seats
        };

        console.log("Dữ liệu gửi lên Backend:", data);

        try {
            setSaving(true);

            if (editingId !== null) {
                await roomAPI.update(editingId, data);
                alert("Cập nhật phòng thành công!");
            } else {
                await roomAPI.create(data);
                alert("Thêm phòng thành công!");
            }

            setShowForm(false);
            setEditingId(null);

            setForm({
                name: "",
                total_seats: ""
            });

            await loadRooms();

        } catch (error) {
            console.error("Lỗi lưu phòng:", error);

            alert(
                error.response?.data?.message ||
                "Không thể lưu phòng chiếu."
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteRoom(id) {
        if (!window.confirm("Xóa phòng chiếu này?")) {
            return;
        }

        try {
            await roomAPI.delete(id);

            alert("Xóa phòng thành công!");

            await loadRooms();

        } catch (error) {
            console.error("Lỗi xóa phòng:", error);

            alert(
                error.response?.data?.message ||
                "Không thể xóa phòng."
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

                                <td>
                                    {room.total_seats} ghế
                                </td>

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
                                <td
                                    colSpan="4"
                                    className="empty"
                                >
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
                                placeholder="Nhập tên phòng"
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
                                step="1"
                                required
                                placeholder="Nhập số ghế"
                                value={form.total_seats}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        total_seats: e.target.value
                                    })
                                }
                            />

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
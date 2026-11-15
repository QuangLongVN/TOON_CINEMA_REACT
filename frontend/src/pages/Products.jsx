import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { productAPI } from "../services/api";

const emptyForm = {
    name: "",
    price: "",
    quantity: "",
    image: ""
};

export default function Products() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    async function loadProducts() {
        try {
            const res = await productAPI.getAll();
            setProducts(res.data);
        } catch {
            alert("Không thể tải sản phẩm.");
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    function openCreate() {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    }

    function openEdit(item) {
        setForm({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || ""
        });

        setEditingId(item.id);
        setShowForm(true);
    }

    async function saveProduct(e) {
        e.preventDefault();

        try {
            const data = {
                ...form,
                price: Number(form.price),
                quantity: Number(form.quantity)
            };

            if (editingId) {
                await productAPI.update(editingId, data);
            } else {
                await productAPI.create(data);
            }

            setShowForm(false);
            await loadProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi lưu sản phẩm.");
        }
    }

    async function deleteProduct(id) {
        if (!confirm("Xóa sản phẩm này?")) return;

        try {
            await productAPI.delete(id);
            await loadProducts();
        } catch {
            alert("Không thể xóa sản phẩm.");
        }
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3>Danh sách sản phẩm</h3>
                    <p>Quản lý bắp rang, nước uống và combo</p>
                </div>

                <button className="btn-primary" onClick={openCreate}>
                    <Plus size={18} />
                    Thêm sản phẩm
                </button>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hình ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((item) => (
                            <tr key={item.id}>
                                <td>#{item.id}</td>

                                <td>
                                    {item.image ? (
                                        <img
                                            className="poster"
                                            src={item.image}
                                            alt={item.name}
                                        />
                                    ) : (
                                        <div className="poster-placeholder">
                                            🍿
                                        </div>
                                    )}
                                </td>

                                <td><strong>{item.name}</strong></td>

                                <td>
                                    {Number(item.price).toLocaleString("vi-VN")}đ
                                </td>

                                <td>{item.quantity}</td>

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
                                                deleteProduct(item.id)
                                            }
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {products.length === 0 && (
                            <tr>
                                <td colSpan="6" className="empty">
                                    Chưa có sản phẩm.
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
                                ? "Sửa sản phẩm"
                                : "Thêm sản phẩm"}
                        </h3>

                        <form onSubmit={saveProduct}>
                            <label>Tên sản phẩm</label>
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

                            <label>Giá bán</label>
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

                            <label>Số lượng</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={form.quantity}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        quantity: e.target.value
                                    })
                                }
                            />

                            <label>Link hình ảnh</label>
                            <input
                                value={form.image}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        image: e.target.value
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
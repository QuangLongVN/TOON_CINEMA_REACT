import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function notify(message, type) {
    const text = String(message || "");
    const inferred = type || (
        /thành công|đã lưu|hợp lệ/i.test(text) ? "success" :
        /không thể|thất bại|lỗi|không tìm thấy/i.test(text) ? "error" :
        /vui lòng|không được|cảnh báo|đang chiếu/i.test(text) ? "warning" : "info"
    );
    window.dispatchEvent(new CustomEvent("toon:notification", {
        detail: { message: text, type: inferred }
    }));
}

export default function NotificationHost() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const onNotify = (event) => {
            const id = `${Date.now()}-${Math.random()}`;
            setItems((prev) => [...prev, { id, ...event.detail }]);
            window.setTimeout(() => {
                setItems((prev) => prev.filter((item) => item.id !== id));
            }, 3600);
        };
        window.addEventListener("toon:notification", onNotify);
        return () => window.removeEventListener("toon:notification", onNotify);
    }, []);

    const icons = {
        success: <CheckCircle2 size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertCircle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, display: "grid", gap: 10, width: "min(380px, calc(100vw - 32px))" }}>
            {items.map((item) => (
                <div key={item.id} role="status" style={{
                    display: "flex", alignItems: "flex-start", gap: 11, padding: "14px 16px",
                    borderRadius: 14, background: "#fff", color: "#30264b",
                    border: `1px solid ${item.type === "error" ? "#fecaca" : item.type === "warning" ? "#fde68a" : "#e9ddff"}`,
                    boxShadow: "0 12px 35px rgba(40,20,80,.14)"
                }}>
                    <span style={{ color: item.type === "error" ? "#dc2626" : item.type === "warning" ? "#d97706" : item.type === "success" ? "#16a34a" : "#7c3aed" }}>
                        {icons[item.type] || icons.info}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5 }}>{item.message}</span>
                    <button onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))} aria-label="Đóng thông báo" style={{ border: 0, background: "transparent", color: "#8b849b", cursor: "pointer", padding: 0 }}>
                        <X size={17} />
                    </button>
                </div>
            ))}
        </div>
    );
}

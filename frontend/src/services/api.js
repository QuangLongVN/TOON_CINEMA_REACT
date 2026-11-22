import axios from "axios";

const rawBase =
    import.meta.env.VITE_API_URL || "http://localhost:3000";

// Loại bỏ /api ở cuối nếu có để tránh bị lặp /api/api/... khi gọi endpoint có /api/...
const normalizedBase = String(rawBase)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

const api = axios.create({
    baseURL: normalizedBase || "http://localhost:3000",
    timeout: 30000
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("toon_token");
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const movieAPI = {
    getAll: () => api.get("/api/movies"),
    getById: (id) => api.get(`/api/movies/${id}`),
    create: (data) => api.post("/api/movies", data),
    update: (id, data) => api.put(`/api/movies/${id}`, data),
    delete: (id) => api.delete(`/api/movies/${id}`)
};

export const roomAPI = {
    getAll: () => api.get("/api/rooms"),
    create: (data) => api.post("/api/rooms", data),
    update: (id, data) => api.put(`/api/rooms/${id}`, data),
    delete: (id) => api.delete(`/api/rooms/${id}`)
};

export const showtimeAPI = {
    getAll: () => api.get("/api/showtimes"),
    create: (data) => api.post("/api/showtimes", data),
    update: (id, data) => api.put(`/api/showtimes/${id}`, data),
    delete: (id) => api.delete(`/api/showtimes/${id}`)
};

export const seatAPI = {
    getBooked: (showtimeId) => api.get(`/api/seats/${showtimeId}`),
    book: (data) => api.post("/api/seats/book", data),
    cancel: (id) => api.delete(`/api/seats/${id}`)
};

export const productAPI = {
    getAll: () => api.get("/api/products"),
    create: (data) => api.post("/api/products", data),
    update: (id, data) => api.put(`/api/products/${id}`, data),
    delete: (id) => api.delete(`/api/products/${id}`)
};

export default api;
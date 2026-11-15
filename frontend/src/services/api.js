import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://toon-cinema-react.onrender.com",
    timeout: 60000
});

export const movieAPI = {
    getAll: () => api.get("/api/movies"),
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
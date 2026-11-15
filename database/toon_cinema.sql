CREATE DATABASE IF NOT EXISTS toon_cinema
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE toon_cinema;

-- Bảng phim
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    duration INT,
    description TEXT,
    poster VARCHAR(500),
    status VARCHAR(50) DEFAULT 'Đang chiếu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng phòng chiếu
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_seats INT NOT NULL DEFAULT 80,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng suất chiếu
CREATE TABLE IF NOT EXISTS showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    room_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,

    FOREIGN KEY (movie_id) REFERENCES movies(id)
        ON DELETE CASCADE,

    FOREIGN KEY (room_id) REFERENCES rooms(id)
        ON DELETE CASCADE
);

-- Bảng ghế đã đặt
CREATE TABLE IF NOT EXISTS booked_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
        ON DELETE CASCADE,

    UNIQUE (showtime_id, seat_number)
);

-- Bảng sản phẩm
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INT DEFAULT 0,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- XÓA CƠ SỞ DỮ LIỆU CŨ (nếu có)
DROP DATABASE IF EXISTS karaoke_managements;
CREATE DATABASE karaoke_managements;
USE karaoke_managements;

-- BẢNG KHÁCH HÀNG
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- BẢNG PHÒNG
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    price_per_hour DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- BẢNG BOOKINGS (1 đơn tổng)
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- BẢNG BOOKING_ROOMS (nối booking và room)
CREATE TABLE booking_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    room_id INT NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    start_time DATETIME,  -- Thời gian bắt đầu riêng cho phòng (nếu khác booking chính)
    end_time DATETIME,    -- Thời gian kết thúc riêng cho phòng (nếu khác booking chính)
    check_in_time DATETIME,   -- Thời gian check-in thực tế
    check_out_time DATETIME,  -- Thời gian check-out thực tế
    notes TEXT,           -- Ghi chú riêng cho phòng này
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- BẢNG THANH TOÁN (cho phép trả theo phòng hoặc đơn tổng)
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    booking_room_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'transfer') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (booking_room_id) REFERENCES booking_rooms(id),
    CHECK (booking_id IS NOT NULL OR booking_room_id IS NOT NULL)
);

-- INDEXES
CREATE INDEX idx_customer_username ON customers(username);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_booking_time ON bookings(start_time, end_time);
CREATE INDEX idx_booking_room_booking ON booking_rooms(booking_id);
CREATE INDEX idx_payment_booking_room ON payments(booking_room_id);
CREATE INDEX idx_payment_booking ON payments(booking_id);

-- DỮ LIỆU MẪU
-- Thêm admin user (password: admin123)
INSERT INTO customers (username, password, name, email, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin@karaoke.com', 'admin'),
('user1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Văn A', 'user1@example.com', 'user'),
('user2', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Thị B', 'user2@example.com', 'user');

-- Thêm một số phòng mẫu
INSERT INTO rooms (name, type, price_per_hour, capacity) VALUES
('Phòng VIP 1', 'VIP', 200000, 10),
('Phòng VIP 2', 'VIP', 200000, 10),
('Phòng Standard 1', 'Standard', 100000, 6),
('Phòng Standard 2', 'Standard', 100000, 6),
('Phòng Standard 3', 'Standard', 100000, 6),
('Phòng Deluxe 1', 'Deluxe', 150000, 8),
('Phòng Deluxe 2', 'Deluxe', 150000, 8),
('Phòng Family 1', 'Family', 180000, 12),
('Phòng Couple 1', 'Couple', 120000, 4),
('Phòng Couple 2', 'Couple', 120000, 4);

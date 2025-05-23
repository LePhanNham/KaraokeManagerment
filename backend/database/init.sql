-- Create database if not exists
CREATE DATABASE IF NOT EXISTS karaoke_management;
USE karaoke_management;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
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

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    price_per_hour DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    customer_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Create indexes
CREATE INDEX idx_customer_username ON customers(username);
CREATE INDEX idx_room_status ON rooms(status);
CREATE INDEX idx_booking_status ON bookings(status);
CREATE INDEX idx_booking_dates ON bookings(start_time, end_time);

-- Thêm index để tối ưu truy vấn thống kê
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Tạo bảng booking_groups để quản lý các booking cùng nhóm
CREATE TABLE IF NOT EXISTS booking_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Thêm cột booking_group_id vào bảng bookings
ALTER TABLE bookings ADD COLUMN booking_group_id INT NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_booking_group FOREIGN KEY (booking_group_id) REFERENCES booking_groups(id);

-- Tạo bảng payments để theo dõi các khoản thanh toán
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NULL,
    booking_group_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'transfer') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (booking_group_id) REFERENCES booking_groups(id),
    CHECK (booking_id IS NOT NULL OR booking_group_id IS NOT NULL)
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX idx_booking_group_id ON bookings(booking_group_id);
CREATE INDEX idx_booking_groups_status ON booking_groups(status);
CREATE INDEX idx_booking_groups_payment ON booking_groups(payment_status);

-- Insert sample customers
INSERT INTO customers (username, password, name, email, phone_number, role) VALUES
('admin', '$2b$10$your_hashed_password', 'Admin User', 'admin@example.com', '0123456789', 'admin'),
('user1', '$2b$10$your_hashed_password', 'John Doe', 'john@example.com', '0123456781', 'user'),
('user2', '$2b$10$your_hashed_password', 'Jane Smith', 'jane@example.com', '0123456782', 'user'),
('vip1', '$2b$10$your_hashed_password', 'VIP Customer', 'vip@example.com', '0123456783', 'user'),
('staff1', '$2b$10$your_hashed_password', 'Staff Member', 'staff@example.com', '0123456784', 'admin');

-- Insert sample rooms with different types and capacities
INSERT INTO rooms (name, type, price_per_hour, capacity, status) VALUES
('Room 101', 'Standard', 100000, 5, 'available'),
('Room 102', 'Standard', 100000, 8, 'available'),
('Room 201', 'VIP', 200000, 10, 'available'),
('Room 202', 'VIP', 200000, 12, 'available'),
('Room 301', 'Premium', 300000, 15, 'available'),
('Room 302', 'Premium', 300000, 20, 'maintenance'),
('Room S01', 'Suite', 500000, 25, 'available');

-- Insert sample bookings with different statuses
INSERT INTO bookings (room_id, customer_id, start_time, end_time, status, total_amount, notes) VALUES
-- Completed bookings (past)
(1, 2, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 2 HOUR), INTERVAL 7 DAY), 'completed', 200000, 'Regular booking'),
(3, 4, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 3 HOUR), INTERVAL 5 DAY), 'completed', 600000, 'VIP customer booking'),

-- Current active bookings
(2, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'confirmed', 300000, 'Current active booking'),
(4, 4, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'confirmed', 400000, 'VIP current booking'),

-- Future bookings
(5, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), 'confirmed', 600000, 'Future booking'),
(1, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 3 HOUR), 'pending', 300000, 'Pending approval'),
(7, 4, DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 4 HOUR), 'confirmed', 2000000, 'Suite booking'),

-- Cancelled bookings
(2, 2, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 2 HOUR), INTERVAL 3 DAY), 'cancelled', 200000, 'Cancelled by customer'),
(6, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 3 HOUR), INTERVAL 2 DAY), 'cancelled', 900000, 'Cancelled due to maintenance');

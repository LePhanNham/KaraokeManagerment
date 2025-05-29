# Karaoke Management API Guide

## Cấu trúc Database Mới

### Bảng chính:
- **customers**: Thông tin khách hàng
- **rooms**: Thông tin phòng karaoke
- **bookings**: Đơn đặt phòng tổng (chứa thông tin chung)
- **booking_rooms**: Chi tiết từng phòng trong đơn đặt
- **payments**: Thanh toán (có thể theo đơn hoặc theo phòng)

## API Endpoints

### 1. Booking Management

#### Tìm phòng trống
```
GET /api/bookings/available?start_time=2025-05-27T10:00:00Z&end_time=2025-05-27T12:00:00Z
```

#### Tạo booking mới
```
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 1,
  "rooms": [
    {
      "room_id": 1,
      "start_time": "2025-05-27T10:00:00Z",
      "end_time": "2025-05-27T12:00:00Z",
      "price_per_hour": 100000
    },
    {
      "room_id": 2,
      "start_time": "2025-05-27T10:00:00Z",
      "end_time": "2025-05-27T12:00:00Z",
      "price_per_hour": 100000
    }
  ],
  "notes": "Booking cho sự kiện"
}
```

#### Lấy danh sách bookings
```
GET /api/bookings
Authorization: Bearer <token>
```

#### Lấy chi tiết booking
```
GET /api/bookings/:id
Authorization: Bearer <token>
```

#### Cập nhật booking
```
PUT /api/bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Đã xác nhận"
}
```

#### Gia hạn booking
```
PUT /api/bookings/:id/extend
Authorization: Bearer <token>
Content-Type: application/json

{
  "new_end_time": "2025-05-27T14:00:00Z"
}
```

#### Xóa booking
```
DELETE /api/bookings/:id
Authorization: Bearer <token>
```

#### Hoàn tất booking với thanh toán
```
POST /api/bookings/:id/complete-with-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "end_time": "2025-05-27T12:00:00Z",
  "total_amount": 400000,
  "payment_method": "cash",
  "notes": "Thanh toán tiền mặt"
}
```

### 2. Room Management

#### Lấy danh sách phòng
```
GET /api/rooms
```

#### Tạo phòng mới
```
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Phòng VIP 3",
  "type": "VIP",
  "price_per_hour": 200000,
  "capacity": 10
}
```

### 3. Customer Management

#### Đăng ký
```
POST /api/customers/register
Content-Type: application/json

{
  "username": "user123",
  "password": "password123",
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "phone_number": "0123456789"
}
```

#### Đăng nhập
```
POST /api/customers/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

## Tính năng đặc biệt

### 1. Đặt nhiều phòng cùng lúc
- Một booking có thể chứa nhiều phòng
- Tự động tính tổng tiền
- Quản lý thời gian chung cho tất cả phòng

### 2. Thanh toán linh hoạt
- Có thể thanh toán theo đơn tổng
- Hoặc thanh toán riêng từng phòng
- Hỗ trợ nhiều phương thức: cash, card, transfer

### 3. Tìm phòng trống thông minh
- Kiểm tra trạng thái phòng
- Kiểm tra xung đột thời gian với booking khác
- Chỉ hiển thị phòng thực sự có thể đặt

## Dữ liệu mẫu

### Accounts:
- **admin/admin123**: Tài khoản quản trị
- **user1/admin123**: Tài khoản khách hàng
- **user2/admin123**: Tài khoản khách hàng

### Phòng có sẵn:
- Phòng VIP 1, 2: 200,000 VNĐ/giờ
- Phòng Standard 1, 2, 3: 100,000 VNĐ/giờ
- Phòng Deluxe 1, 2: 150,000 VNĐ/giờ
- Phòng Family 1: 180,000 VNĐ/giờ
- Phòng Couple 1, 2: 120,000 VNĐ/giờ

## Chạy ứng dụng

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo database:
```bash
# Chạy file database/init.sql trong MySQL
```

3. Khởi động server:
```bash
npm run dev
```

Server sẽ chạy tại: http://localhost:5000

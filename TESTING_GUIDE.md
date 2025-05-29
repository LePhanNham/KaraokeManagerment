# 🧪 **Testing Guide - Frontend với Mock Data**

## ❌ **Vấn đề hiện tại:**

**Backend không thể khởi động** do:
- MySQL server không chạy hoặc không có trong PATH
- Database `karaoke_managements` có thể chưa được tạo
- Dependencies có thể chưa được cài đặt đúng

## ✅ **Giải pháp tạm thời:**

### **1. Test Frontend với Mock Data**

Để test frontend mà không cần backend, hãy tạo mock data trong services:

#### **Cập nhật API base URL:**

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Thêm mock mode
const MOCK_MODE = true; // Set to true for testing without backend

export const api = axios.create({
  baseURL: MOCK_MODE ? '/mock-api' : API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### **Tạo Mock Service:**

```typescript
// frontend/src/services/mockService.ts
export const mockService = {
  // Mock rooms data
  rooms: [
    { id: 1, name: 'Phòng VIP 1', type: 'VIP', capacity: 10, price_per_hour: 200000, description: 'Phòng VIP cao cấp' },
    { id: 2, name: 'Phòng Standard 1', type: 'Standard', capacity: 6, price_per_hour: 100000, description: 'Phòng tiêu chuẩn' },
    { id: 3, name: 'Phòng Deluxe 1', type: 'Deluxe', capacity: 8, price_per_hour: 150000, description: 'Phòng deluxe' }
  ],

  // Mock user data
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    phone: '0123456789'
  },

  // Mock API responses
  login: (email: string, password: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === 'test@example.com' && password === 'password') {
          resolve({
            success: true,
            data: mockService.user,
            token: 'mock_jwt_token'
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }, 1000);
    });
  },

  getRooms: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockService.rooms
        });
      }, 500);
    });
  },

  findAvailableRooms: (startTime: string, endTime: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockService.rooms // Mock: all rooms available
        });
      }, 1000);
    });
  },

  createBooking: (bookingData: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: Date.now(),
            ...bookingData,
            status: 'confirmed',
            created_at: new Date().toISOString()
          },
          message: 'Booking created successfully'
        });
      }, 1500);
    });
  }
};
```

### **2. Test Scenarios**

#### **Scenario 1: Login Test**
1. Vào `http://localhost:3000/login`
2. Nhập:
   - Email: `test@example.com`
   - Password: `password`
3. Kết quả mong đợi: Đăng nhập thành công, chuyển đến Dashboard

#### **Scenario 2: Booking Flow Test**
1. Đăng nhập thành công
2. Vào `http://localhost:3000/bookings`
3. Chọn thời gian đặt phòng
4. Nhấn "Tìm phòng trống"
5. Chọn phòng
6. Nhấn "Tiếp tục"
7. Vào trang BookingConfirmation
8. Kiểm tra thông tin
9. Nhấn "Xác nhận đặt phòng"
10. Kết quả mong đợi: Thông báo thành công

#### **Scenario 3: Rooms Management Test**
1. Vào `http://localhost:3000/rooms`
2. Xem danh sách phòng
3. Test các tính năng:
   - Thêm phòng mới
   - Sửa thông tin phòng
   - Xóa phòng
   - Lọc phòng theo loại

### **3. Kiểm tra Architecture mới**

#### **Separation of Concerns:**
- ✅ **Page components** chỉ hiển thị UI
- ✅ **Hooks** quản lý state và side effects
- ✅ **Services** xử lý API calls và business logic

#### **Test từng layer:**

**Service Layer:**
```typescript
// Test service functions
import bookingConfirmationService from './services/bookingConfirmationService';

const result = bookingConfirmationService.validateTimeRange(
  '2024-01-01T10:00',
  '2024-01-01T12:00',
  '2024-01-01T09:00',
  '2024-01-01T15:00'
);
console.log('Validation result:', result); // Should be null (valid)
```

**Hook Layer:**
```typescript
// Test hook in component
const MyTestComponent = () => {
  const {
    selectedRooms,
    totalAmount,
    handleEditRoom,
    createBooking
  } = useBookingConfirmation(mockData);

  console.log('Hook states:', { selectedRooms, totalAmount });
  
  return <div>Testing hook...</div>;
};
```

**Component Layer:**
```typescript
// Test component rendering
const BookingConfirmation = () => {
  const hookData = useBookingConfirmation(initialData);
  
  // Component chỉ quan tâm đến UI
  return (
    <div>
      {/* UI JSX only */}
    </div>
  );
};
```

## 🚀 **Kết quả mong đợi:**

### **✅ Architecture Benefits:**
1. **Clean separation**: UI, State, Logic tách biệt rõ ràng
2. **Reusable**: Services có thể dùng ở nhiều nơi
3. **Testable**: Có thể test từng layer riêng
4. **Maintainable**: Dễ sửa đổi và mở rộng

### **✅ User Experience:**
1. **Smooth navigation**: Chuyển trang mượt mà
2. **Real-time feedback**: Loading states, error handling
3. **Intuitive UI**: Giao diện dễ sử dụng
4. **Responsive**: Hoạt động tốt trên mobile

## 🔧 **Sửa Backend (Tương lai):**

### **Bước 1: Cài đặt MySQL**
```bash
# Windows: Download MySQL Installer
# hoặc sử dụng XAMPP/WAMP

# Tạo database
CREATE DATABASE karaoke_managements;
```

### **Bước 2: Cài dependencies**
```bash
cd backend
npm install
```

### **Bước 3: Chạy backend**
```bash
npm run dev
```

### **Bước 4: Test API**
```bash
curl http://localhost:5000/api/test
```

## 📋 **Checklist Test:**

- [ ] Frontend compile thành công
- [ ] Login với mock data
- [ ] Navigation giữa các trang
- [ ] Booking flow hoàn chỉnh
- [ ] Room management
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Architecture separation

## 🎯 **Kết luận:**

**Frontend đã được refactor thành công với architecture sạch:**
- ✅ **Pages**: UI only
- ✅ **Hooks**: State management
- ✅ **Services**: API & Logic
- ✅ **Clean separation of concerns**
- ✅ **Maintainable và scalable**

**Backend sẽ được sửa sau khi có môi trường MySQL phù hợp.**

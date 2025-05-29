# 🏗️ **Template Structure cho các trang**

## 📁 **Cấu trúc chuẩn cho mỗi trang:**

```
📦 [PageName]
├── 🎨 pages/[PageName].tsx          (UI Only)
├── 🔄 hooks/use[PageName].ts        (State Management)
└── ⚙️ services/[pageName]Service.ts (API & Logic)
```

## 🔧 **Danh sách các trang cần refactor:**

### **1. Dashboard**
- `pages/Dashboard.tsx`
- `hooks/useDashboard.ts`
- `services/dashboardService.ts`

### **2. Rooms**
- `pages/Rooms.tsx`
- `hooks/useRooms.ts`
- `services/roomsPageService.ts`

### **3. Customers**
- `pages/Customers.tsx`
- `hooks/useCustomers.ts`
- `services/customersService.ts`

### **4. Reports**
- `pages/Reports.tsx`
- `hooks/useReports.ts`
- `services/reportsService.ts`

### **5. Settings**
- `pages/Settings.tsx`
- `hooks/useSettings.ts`
- `services/settingsService.ts`

### **6. Profile**
- `pages/Profile.tsx`
- `hooks/useProfile.ts`
- `services/profileService.ts`

### **7. Checkout**
- `pages/Checkout.tsx`
- `hooks/useCheckout.ts`
- `services/checkoutService.ts`

### **8. CheckoutDetail**
- `pages/CheckoutDetail.tsx`
- `hooks/useCheckoutDetail.ts`
- `services/checkoutDetailService.ts`

## 📝 **Template Service:**

```typescript
// services/[pageName]Service.ts
import { ApiResponse } from '../types/interfaces';

export const [pageName]Service = {
  /**
   * Lấy dữ liệu chính của trang
   */
  getData: async (): Promise<any[]> => {
    try {
      // API call
      // Data processing
      // Return result
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi khi tải dữ liệu');
    }
  },

  /**
   * Tạo mới
   */
  create: async (data: any): Promise<any> => {
    try {
      // API call
      // Return result
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi khi tạo mới');
    }
  },

  /**
   * Cập nhật
   */
  update: async (id: number, data: any): Promise<any> => {
    try {
      // API call
      // Return result
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi khi cập nhật');
    }
  },

  /**
   * Xóa
   */
  delete: async (id: number): Promise<boolean> => {
    try {
      // API call
      // Return result
    } catch (error: any) {
      throw new Error(error.message || 'Lỗi khi xóa');
    }
  },

  /**
   * Validate dữ liệu
   */
  validate: (data: any): string | null => {
    // Validation logic
    return null;
  },

  /**
   * Format dữ liệu cho hiển thị
   */
  formatForDisplay: (data: any): any => {
    // Format logic
    return data;
  }
};
```

## 📝 **Template Hook:**

```typescript
// hooks/use[PageName].ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import [pageName]Service from '../services/[pageName]Service';

export const use[PageName] = () => {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  // States
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // API calls
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await [pageName]Service.getData();
      setData(result);
    } catch (error: any) {
      setError(error.message);
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      setLoading(true);
      await [pageName]Service.create(formData);
      notifySuccess('Tạo mới thành công');
      await loadData();
      setShowDialog(false);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      setLoading(true);
      await [pageName]Service.update(id, formData);
      notifySuccess('Cập nhật thành công');
      await loadData();
      setShowDialog(false);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await [pageName]Service.delete(id);
      notifySuccess('Xóa thành công');
      await loadData();
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (item?: any) => {
    setSelectedItem(item || null);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setShowDialog(false);
  };

  const clearError = () => {
    setError('');
  };

  return {
    // States
    data,
    loading,
    error,
    selectedItem,
    showDialog,

    // Actions
    handleCreate,
    handleUpdate,
    handleDelete,
    handleOpenDialog,
    handleCloseDialog,
    loadData,
    clearError
  };
};
```

## 📝 **Template Component:**

```tsx
// pages/[PageName].tsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { use[PageName] } from '../hooks/use[PageName]';

const [PageName]: React.FC = () => {
  const {
    // States
    data,
    loading,
    error,
    selectedItem,
    showDialog,

    // Actions
    handleCreate,
    handleUpdate,
    handleDelete,
    handleOpenDialog,
    handleCloseDialog,
    clearError
  } = use[PageName]();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        [Page Title]
      </Typography>

      {/* Page content */}
      {/* Use states and actions from hook */}
    </Box>
  );
};

export default [PageName];
```

## 🚀 **Lợi ích:**

1. **Consistency**: Tất cả trang đều có cấu trúc giống nhau
2. **Maintainability**: Dễ dàng maintain và debug
3. **Reusability**: Logic có thể tái sử dụng
4. **Testability**: Dễ dàng test từng layer
5. **Scalability**: Dễ dàng mở rộng tính năng

## 📋 **Checklist refactor:**

- [ ] Dashboard
- [ ] Rooms  
- [ ] Customers
- [ ] Reports
- [ ] Settings
- [ ] Profile
- [ ] Checkout
- [ ] CheckoutDetail
- [x] Bookings (Done)
- [x] BookingConfirmation (Done)

**🎯 Mỗi trang sẽ có cấu trúc: Page (UI) + Hook (State) + Service (API/Logic)**

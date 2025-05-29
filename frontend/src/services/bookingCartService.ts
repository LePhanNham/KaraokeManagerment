import { BookingCartItem } from '../contexts/BookingCartContext';
import { bookingService } from './bookingService';

export interface CheckoutData {
  customer_id: number;
  items: BookingCartItem[];
  total_amount: number;
  notes?: string;
}

/**
 * Service để xử lý logic cho Booking Cart
 */
export const bookingCartService = {
  /**
   * Validate thời gian booking
   */
  validateBookingTime: (startTime: string, endTime: string): string | null => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start <= now) {
      return 'Thời gian bắt đầu phải sau thời điểm hiện tại';
    }

    if (start >= end) {
      return 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc';
    }

    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) {
      return 'Thời gian đặt phòng tối thiểu là 1 giờ';
    }

    if (diffHours > 24) {
      return 'Thời gian đặt phòng tối đa là 24 giờ';
    }

    return null;
  },

  /**
   * Kiểm tra xung đột thời gian giữa các booking
   */
  checkTimeConflicts: (items: BookingCartItem[]): string[] => {
    const conflicts: string[] = [];
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];
        
        // Check if same room
        if (item1.room.id === item2.room.id) {
          const start1 = new Date(item1.start_time);
          const end1 = new Date(item1.end_time);
          const start2 = new Date(item2.start_time);
          const end2 = new Date(item2.end_time);
          
          // Check time overlap
          if ((start1 < end2 && end1 > start2)) {
            conflicts.push(
              `Xung đột thời gian: ${item1.room.name} (${bookingCartService.formatTime(item1.start_time)} - ${bookingCartService.formatTime(item1.end_time)}) và (${bookingCartService.formatTime(item2.start_time)} - ${bookingCartService.formatTime(item2.end_time)})`
            );
          }
        }
      }
    }
    
    return conflicts;
  },

  /**
   * Validate toàn bộ giỏ hàng trước khi checkout
   */
  validateCart: (items: BookingCartItem[]): string[] => {
    const errors: string[] = [];
    
    if (items.length === 0) {
      errors.push('Giỏ hàng trống. Vui lòng thêm ít nhất một booking.');
      return errors;
    }
    
    // Validate từng item
    items.forEach((item, index) => {
      const timeError = bookingCartService.validateBookingTime(item.start_time, item.end_time);
      if (timeError) {
        errors.push(`Booking ${index + 1} (${item.room.name}): ${timeError}`);
      }
    });
    
    // Check conflicts
    const conflicts = bookingCartService.checkTimeConflicts(items);
    errors.push(...conflicts);
    
    return errors;
  },

  /**
   * Chuẩn bị dữ liệu để gửi API
   */
  prepareCheckoutData: (customerId: number, items: BookingCartItem[], notes?: string): CheckoutData => {
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    return {
      customer_id: customerId,
      items,
      total_amount: totalAmount,
      notes
    };
  },

  /**
   * Chuyển đổi cart items thành format API
   */
  convertToAPIFormat: (items: BookingCartItem[]) => {
    return items.map(item => ({
      room_id: item.room.id!,
      start_time: item.start_time,
      end_time: item.end_time,
      price_per_hour: item.room.price_per_hour,
      notes: item.notes
    }));
  },

  /**
   * Checkout - tạo tất cả bookings
   */
  checkout: async (checkoutData: CheckoutData) => {
    try {
      // Validate trước khi gửi
      const validationErrors = bookingCartService.validateCart(checkoutData.items);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // Chuyển đổi format cho API
      const apiData = {
        customer_id: checkoutData.customer_id,
        rooms: bookingCartService.convertToAPIFormat(checkoutData.items),
        total_amount: checkoutData.total_amount,
        notes: checkoutData.notes
      };

      // Gọi API tạo booking
      const response = await bookingService.createBooking(apiData);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: `Đặt phòng thành công! ${checkoutData.items.length} booking đã được tạo.`
        };
      } else {
        throw new Error(response.message || 'Lỗi khi tạo booking');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      throw new Error(error.message || 'Lỗi khi checkout');
    }
  },

  /**
   * Tính tổng thống kê giỏ hàng
   */
  getCartStats: (items: BookingCartItem[]) => {
    const totalItems = items.length;
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalHours = items.reduce((sum, item) => sum + item.hours, 0);
    
    const roomTypes = items.reduce((acc, item) => {
      acc[item.room.type] = (acc[item.room.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const uniqueRooms = new Set(items.map(item => item.room.id)).size;
    
    return {
      totalItems,
      totalAmount,
      totalHours,
      roomTypes,
      uniqueRooms
    };
  },

  /**
   * Sắp xếp cart items
   */
  sortCartItems: (items: BookingCartItem[], sortBy: 'time' | 'room' | 'price' = 'time') => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'room':
          return a.room.name.localeCompare(b.room.name);
        case 'price':
          return b.subtotal - a.subtotal;
        default:
          return 0;
      }
    });
  },

  /**
   * Lọc cart items theo ngày
   */
  filterCartItemsByDate: (items: BookingCartItem[], date: string) => {
    const targetDate = new Date(date).toDateString();
    return items.filter(item => {
      const itemDate = new Date(item.start_time).toDateString();
      return itemDate === targetDate;
    });
  },

  /**
   * Format thời gian
   */
  formatTime: (dateTime: string): string => {
    return new Date(dateTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format ngày
   */
  formatDate: (dateTime: string): string => {
    return new Date(dateTime).toLocaleDateString('vi-VN');
  },

  /**
   * Format datetime đầy đủ
   */
  formatDateTime: (dateTime: string): string => {
    return new Date(dateTime).toLocaleString('vi-VN');
  },

  /**
   * Format giá tiền
   */
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  /**
   * Tạo thời gian mặc định cho booking mới
   */
  getDefaultBookingTime: () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ sau
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 giờ sau start

    return {
      start_time: startTime.toISOString().slice(0, 16), // Format for datetime-local input
      end_time: endTime.toISOString().slice(0, 16)
    };
  }
};

export default bookingCartService;

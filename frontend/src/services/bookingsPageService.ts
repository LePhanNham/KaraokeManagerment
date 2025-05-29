import { Room, Booking, BookingWithRoom } from '../types/interfaces';
import { roomService } from './roomService';
import { bookingService } from './bookingService';

export interface BookingTimeRange {
  start_time: string;
  end_time: string;
}

export interface SelectedRoomWithDetails extends Room {
  start_time: string;
  end_time: string;
  hours: number;
  subtotal: number;
}

/**
 * Service để xử lý logic cho trang Bookings
 */
export const bookingsPageService = {
  /**
   * Lấy tất cả phòng
   */
  getAllRooms: async (): Promise<Room[]> => {
    try {
      const response = await roomService.getAllRooms();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tải danh sách phòng');
    } catch (error: any) {
      console.error('Error getting all rooms:', error);
      throw new Error(error.message || 'Lỗi khi tải danh sách phòng');
    }
  },

  /**
   * Tìm phòng trống trong khoảng thời gian
   */
  findAvailableRooms: async (startTime: string, endTime: string): Promise<Room[]> => {
    try {
      const response = await bookingService.findAvailableRooms(startTime, endTime);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tìm phòng trống');
    } catch (error: any) {
      console.error('Error finding available rooms:', error);
      throw new Error(error.message || 'Lỗi khi tìm phòng trống');
    }
  },

  /**
   * Lấy danh sách booking của user
   */
  getUserBookings: async (userId: number): Promise<BookingWithRoom[]> => {
    try {
      const response = await bookingService.getUserBookings(userId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tải danh sách đặt phòng');
    } catch (error: any) {
      console.error('Error getting user bookings:', error);
      throw new Error(error.message || 'Lỗi khi tải danh sách đặt phòng');
    }
  },

  /**
   * Validate thời gian đặt phòng
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
   * Tính số giờ và thành tiền cho phòng
   */
  calculateRoomDetails: (
    room: Room,
    startTime: string,
    endTime: string
  ): SelectedRoomWithDetails => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const subtotal = hours * room.price_per_hour;

    return {
      ...room,
      start_time: startTime,
      end_time: endTime,
      hours,
      subtotal
    };
  },

  /**
   * Tính tổng tiền cho nhiều phòng
   */
  calculateTotalAmount: (rooms: SelectedRoomWithDetails[]): number => {
    return rooms.reduce((sum, room) => sum + room.subtotal, 0);
  },

  /**
   * Chuẩn bị dữ liệu để chuyển đến trang confirmation
   */
  prepareConfirmationData: (
    selectedRooms: Room[],
    timeRange: BookingTimeRange,
    notes?: string
  ) => {
    const roomsWithDetails = selectedRooms.map(room =>
      bookingsPageService.calculateRoomDetails(room, timeRange.start_time, timeRange.end_time)
    );

    return {
      selectedRooms: roomsWithDetails,
      originalStartTime: timeRange.start_time,
      originalEndTime: timeRange.end_time,
      notes
    };
  },

  /**
   * Format datetime cho hiển thị
   */
  formatDateTime: (dateTime: string): string => {
    return new Date(dateTime).toLocaleString('vi-VN');
  },

  /**
   * Format date cho input
   */
  formatDateForInput: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  /**
   * Tạo thời gian mặc định (1 giờ từ bây giờ)
   */
  getDefaultTimeRange: (): BookingTimeRange => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ sau
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 giờ sau start

    return {
      start_time: bookingsPageService.formatDateForInput(startTime),
      end_time: bookingsPageService.formatDateForInput(endTime)
    };
  },

  /**
   * Lọc phòng theo loại
   */
  filterRoomsByType: (rooms: Room[], type: string): Room[] => {
    if (!type || type === 'all') {
      return rooms;
    }
    return rooms.filter(room => room.type === type);
  },

  /**
   * Lọc phòng theo sức chứa
   */
  filterRoomsByCapacity: (rooms: Room[], minCapacity: number): Room[] => {
    if (!minCapacity) {
      return rooms;
    }
    return rooms.filter(room => room.capacity >= minCapacity);
  },

  /**
   * Lọc phòng theo giá
   */
  filterRoomsByPrice: (rooms: Room[], maxPrice: number): Room[] => {
    if (!maxPrice) {
      return rooms;
    }
    return rooms.filter(room => room.price_per_hour <= maxPrice);
  },

  /**
   * Áp dụng tất cả bộ lọc
   */
  applyFilters: (
    rooms: Room[],
    filters: {
      type?: string;
      minCapacity?: number;
      maxPrice?: number;
    }
  ): Room[] => {
    let filteredRooms = rooms;

    if (filters.type) {
      filteredRooms = bookingsPageService.filterRoomsByType(filteredRooms, filters.type);
    }

    if (filters.minCapacity) {
      filteredRooms = bookingsPageService.filterRoomsByCapacity(filteredRooms, filters.minCapacity);
    }

    if (filters.maxPrice) {
      filteredRooms = bookingsPageService.filterRoomsByPrice(filteredRooms, filters.maxPrice);
    }

    return filteredRooms;
  },

  /**
   * Lấy các loại phòng unique
   */
  getRoomTypes: (rooms: Room[]): string[] => {
    const types = rooms.map(room => room.type);
    return [...new Set(types)];
  },

  /**
   * Validate dữ liệu trước khi chuyển trang
   */
  validateBeforeConfirmation: (
    selectedRooms: Room[],
    timeRange: BookingTimeRange
  ): string | null => {
    if (selectedRooms.length === 0) {
      return 'Vui lòng chọn ít nhất một phòng';
    }

    const timeValidation = bookingsPageService.validateBookingTime(
      timeRange.start_time,
      timeRange.end_time
    );

    if (timeValidation) {
      return timeValidation;
    }

    return null;
  }
};

export default bookingsPageService;

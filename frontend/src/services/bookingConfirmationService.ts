import { Room } from '../types/interfaces';
import { bookingService } from './bookingService';

export interface SelectedRoom extends Room {
  start_time: string;
  end_time: string;
  hours: number;
  subtotal: number;
}

export interface CreateBookingRequest {
  customer_id: number;
  rooms: Array<{
    room_id: number;
    start_time: string;
    end_time: string;
    price_per_hour: number;
  }>;
  total_amount: number;
  notes?: string;
}

export interface BookingConfirmationData {
  selectedRooms: SelectedRoom[];
  originalStartTime: string;
  originalEndTime: string;
  notes?: string;
}

/**
 * Service để xử lý logic cho trang BookingConfirmation
 */
export const bookingConfirmationService = {
  /**
   * Lấy danh sách phòng trống trong khoảng thời gian
   */
  getAvailableRooms: async (startTime: string, endTime: string): Promise<Room[]> => {
    try {
      const response = await bookingService.findAvailableRooms(startTime, endTime);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tải danh sách phòng trống');
    } catch (error: any) {
      console.error('Error getting available rooms:', error);
      throw new Error(error.message || 'Lỗi khi tải danh sách phòng trống');
    }
  },

  /**
   * Lọc phòng trống (loại bỏ phòng đã chọn)
   */
  filterAvailableRooms: (allRooms: Room[], selectedRoomIds: (number | undefined)[]): Room[] => {
    return allRooms.filter(room => !selectedRoomIds.includes(room.id));
  },

  /**
   * Tính số giờ và thành tiền
   */
  calculateHoursAndSubtotal: (startTime: string, endTime: string, pricePerHour: number) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const subtotal = hours * pricePerHour;
    return { hours, subtotal };
  },

  /**
   * Validate khoảng thời gian
   */
  validateTimeRange: (
    startTime: string, 
    endTime: string, 
    originalStartTime: string, 
    originalEndTime: string
  ): string | null => {
    const originalStart = new Date(originalStartTime);
    const originalEnd = new Date(originalEndTime);
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    if (newStart < originalStart || newEnd > originalEnd) {
      return 'Thời gian phải nằm trong khoảng đã lọc';
    }

    if (newStart >= newEnd) {
      return 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc';
    }

    return null;
  },

  /**
   * Cập nhật thông tin phòng đã chọn
   */
  updateSelectedRoom: (
    selectedRooms: SelectedRoom[], 
    updatedRoom: SelectedRoom
  ): SelectedRoom[] => {
    return selectedRooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    );
  },

  /**
   * Xóa phòng khỏi danh sách đã chọn
   */
  removeSelectedRoom: (selectedRooms: SelectedRoom[], roomId: number): SelectedRoom[] => {
    return selectedRooms.filter(room => room.id !== roomId);
  },

  /**
   * Thêm phòng vào danh sách đã chọn
   */
  addSelectedRoom: (
    selectedRooms: SelectedRoom[], 
    room: Room, 
    startTime: string, 
    endTime: string
  ): SelectedRoom[] => {
    const { hours, subtotal } = bookingConfirmationService.calculateHoursAndSubtotal(
      startTime,
      endTime,
      room.price_per_hour
    );

    const newSelectedRoom: SelectedRoom = {
      ...room,
      start_time: startTime,
      end_time: endTime,
      hours,
      subtotal
    };

    return [...selectedRooms, newSelectedRoom];
  },

  /**
   * Tính tổng tiền
   */
  calculateTotalAmount: (selectedRooms: SelectedRoom[]): number => {
    return selectedRooms.reduce((sum, room) => sum + room.subtotal, 0);
  },

  /**
   * Chuẩn bị dữ liệu để tạo booking
   */
  prepareBookingData: (
    customerId: number,
    selectedRooms: SelectedRoom[],
    totalAmount: number,
    notes?: string
  ): CreateBookingRequest => {
    return {
      customer_id: customerId,
      rooms: selectedRooms.map(room => ({
        room_id: room.id!,
        start_time: room.start_time,
        end_time: room.end_time,
        price_per_hour: room.price_per_hour
      })),
      total_amount: totalAmount,
      notes
    };
  },

  /**
   * Tạo booking
   */
  createBooking: async (bookingData: CreateBookingRequest) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      throw new Error(error.message || 'Lỗi khi đặt phòng');
    }
  },

  /**
   * Format datetime cho hiển thị
   */
  formatDateTime: (dateTime: string): string => {
    return new Date(dateTime).toLocaleString('vi-VN');
  },

  /**
   * Format time cho hiển thị
   */
  formatTime: (dateTime: string): string => {
    return new Date(dateTime).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Validate dữ liệu booking trước khi tạo
   */
  validateBookingData: (
    customerId: number | undefined,
    selectedRooms: SelectedRoom[]
  ): string | null => {
    if (!customerId) {
      return 'Vui lòng đăng nhập';
    }

    if (selectedRooms.length === 0) {
      return 'Vui lòng chọn ít nhất một phòng';
    }

    return null;
  }
};

export default bookingConfirmationService;

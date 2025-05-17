import api from './api';
import { ApiResponse } from '../types/api';
import { Room, Booking, BookingInput } from '../types/booking';

export const bookingService = {
  findAvailableRooms: async (startTime: string, endTime: string): Promise<ApiResponse<Room[]>> => {
    try {
      // Validate dates first
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Định dạng thời gian không hợp lệ');
      }

      if (start >= end) {
        throw new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
      }

      if (start < new Date()) {
        throw new Error('Không thể đặt phòng trong quá khứ');
      }

      // Make API call
      const response = await api.get<ApiResponse<Room[]>>('/bookings/available', {
        params: {
          start_time: start.toISOString(),
          end_time: end.toISOString()
        }
      });

      return response.data;

    } catch (error: any) {
      console.error('Error in findAvailableRooms:', error);
      throw error.response?.data || error;
    }
  },

  createBooking: async (bookingData: BookingInput): Promise<ApiResponse<Booking>> => {
    try {
      const formattedData = {
        ...bookingData,
        total_amount: bookingData.total_amount || 0,
        notes: bookingData.notes || '',
        status: bookingData.status || 'pending'
      };

      const response = await api.post<ApiResponse<Booking>>('/bookings', formattedData);
      console.log('Booking created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getAllBookings: async (): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error getting all bookings:', error);
      throw error;
    }
  },

  updateBooking: async (id: number, data: Partial<BookingInput>): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },
};
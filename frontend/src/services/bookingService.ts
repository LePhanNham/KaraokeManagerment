import api from './api';
import { ApiResponse } from '../types/interfaces';
import { Room, Booking, BookingInput } from '../types/interfaces';

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
      // Add timeout to prevent hanging requests
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, data, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating booking:', error);
      
      // Create a standardized error object
      const errorResponse = {
        success: false,
        message: 'Unknown error occurred',
        error: error
      };
      
      if (error.response) {
        // The server responded with an error status
        errorResponse.message = error.response.data?.message || 
                               `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorResponse.message = 'No response received from server. The server might be down.';
      } else {
        // Something happened in setting up the request
        errorResponse.message = error.message || 'Error occurred while setting up the request';
      }
      
      throw errorResponse;
    }
  },

  cancelBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, {
        status: 'cancelled'
      }, {
        timeout: 10000
      });
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      
      const errorResponse = {
        success: false,
        message: 'Failed to cancel booking',
        error: error
      };
      
      if (error.response) {
        errorResponse.message = error.response.data?.message || 
                               `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorResponse.message = 'No response received from server';
      } else {
        errorResponse.message = error.message || 'Unknown error occurred';
      }
      
      throw errorResponse;
    }
  },

  completeBooking: async (id: number, endTime?: Date, totalAmount?: number): Promise<ApiResponse<Booking>> => {
    try {
      const data: Partial<BookingInput> = {
        status: 'completed'
      };
      
      if (endTime) {
        // Format date to MySQL compatible format (YYYY-MM-DD HH:MM:SS)
        const year = endTime.getFullYear();
        const month = String(endTime.getMonth() + 1).padStart(2, '0');
        const day = String(endTime.getDate()).padStart(2, '0');
        const hours = String(endTime.getHours()).padStart(2, '0');
        const minutes = String(endTime.getMinutes()).padStart(2, '0');
        const seconds = String(endTime.getSeconds()).padStart(2, '0');
        
        data.end_time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
      
      if (totalAmount !== undefined) {
        data.total_amount = totalAmount;
      }
      
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}`, data, {
        timeout: 15000,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error completing booking:', error);
      
      const errorResponse = {
        success: false,
        message: 'Không thể trả phòng',
        error: error
      };
      
      if (error.response) {
        errorResponse.message = error.response.data?.message || 
                               `Lỗi máy chủ: ${error.response.status}`;
      } else if (error.request) {
        errorResponse.message = 'Không nhận được phản hồi từ máy chủ';
      } else {
        errorResponse.message = error.message || 'Đã xảy ra lỗi không xác định';
      }
      
      throw errorResponse;
    }
  },
};
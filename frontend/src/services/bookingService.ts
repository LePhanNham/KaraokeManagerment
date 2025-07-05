import api from './api';
import { ApiResponse } from '../types/interfaces';
import { Room, Booking, BookingInput, BookingGroup, BookingWithRoom } from '../types/interfaces';

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

      // Make API call with proper error handling
      try {
        console.log('Sending request to find available rooms:', {
          start_time: start.toISOString(),
          end_time: end.toISOString()
        });

        // Add timeout and detailed error handling
        const response = await api.post<ApiResponse<Room[]>>('/bookings/find-available-rooms', {
          start_time: start.toISOString(),
          end_time: end.toISOString()
        }, {
          timeout: 15000 // Increase timeout to 15 seconds
        });

        console.log('Available rooms response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('API error details:', error.response?.data || error);
        console.log('Response status:', error.response?.status);
        console.log('Response headers:', error.response?.headers);
        console.log('Response data:', error.response?.data);

        // Nếu có response từ server
        if (error.response) {
          throw {
            success: false,
            message: error.response.data?.message || `Lỗi máy chủ: ${error.response.status}`,
            data: []
          };
        }

        // Nếu không có response (timeout, network error)
        if (error.request) {
          throw {
            success: false,
            message: 'Không nhận được phản hồi từ máy chủ',
            data: []
          };
        }

        // Lỗi khác
        throw {
          success: false,
          message: 'Lỗi kết nối đến máy chủ',
          data: []
        };
      }
    } catch (error: any) {
      console.error('Error in findAvailableRooms:', error);

      // Create a standardized error response
      const errorResponse: ApiResponse<Room[]> = {
        success: false,
        message: error.message || 'Lỗi khi tìm phòng trống',
        data: []
      };

      throw errorResponse;
    }
  },

  createBooking: async (bookingData: BookingInput): Promise<ApiResponse<Booking>> => {
    try {
      // Cấu trúc mới: một booking có thể chứa nhiều phòng
      const rooms = bookingData.rooms || [{
        room_id: bookingData.room_id,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        price_per_hour: bookingData.price_per_hour || 0
      }];

      // Tính tổng tiền dựa trên thời gian và giá phòng
      let totalAmount = 0;
      if (bookingData.total_amount) {
        totalAmount = bookingData.total_amount;
      } else {
        // Tính tự động nếu không có total_amount
        for (const room of rooms) {
          if (room.start_time && room.end_time && room.price_per_hour) {
            const startTime = new Date(room.start_time);
            const endTime = new Date(room.end_time);
            const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
            totalAmount += hours * room.price_per_hour;
          }
        }
      }

      const formattedData = {
        customer_id: bookingData.customer_id,
        bookings: rooms, // Backend expect 'bookings' not 'rooms'
        total_amount: totalAmount,
        notes: bookingData.notes || ''
      };

      console.log('Creating booking with data:', formattedData);
      const response = await api.post<ApiResponse<Booking>>('/bookings', formattedData);
      console.log('Booking created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getAllBookings: async (): Promise<ApiResponse<BookingWithRoom[]>> => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>('/bookings');

      if (response.data.success && response.data.data) {
        // Với cấu trúc mới, booking đã chứa thông tin rooms
        const bookingsWithRoom: BookingWithRoom[] = response.data.data.map(booking => {
          // Lấy thông tin phòng đầu tiên (để backward compatibility)
          const firstRoom = booking.rooms?.[0];

          return {
            ...booking,
            // Backward compatibility fields
            room_id: firstRoom?.room_id,
            price_per_hour: firstRoom?.price_per_hour,
            // Display fields
            roomName: firstRoom?.room?.name || `Phòng ${firstRoom?.room_id}`,
            roomType: firstRoom?.room?.type,
            roomCapacity: firstRoom?.room?.capacity,
            roomPrice: firstRoom?.price_per_hour,
            room: firstRoom?.room
          };
        });

        return {
          ...response.data,
          data: bookingsWithRoom
        };
      }

      return response.data as ApiResponse<BookingWithRoom[]>;
    } catch (error: any) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  },

  getUserBookings: async (userId: number): Promise<ApiResponse<BookingWithRoom[]>> => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>(`/bookings/user/${userId}`);

      if (response.data.success && response.data.data) {
        // Với cấu trúc mới, booking đã chứa thông tin rooms
        const bookingsWithRoom: BookingWithRoom[] = response.data.data.map(booking => {
          // Lấy thông tin phòng đầu tiên (để backward compatibility)
          const firstRoom = booking.rooms?.[0];

          return {
            ...booking,
            // Backward compatibility fields
            room_id: firstRoom?.room_id,
            price_per_hour: firstRoom?.price_per_hour,
            // Display fields
            roomName: firstRoom?.room?.name || `Phòng ${firstRoom?.room_id}`,
            roomType: firstRoom?.room?.type,
            roomCapacity: firstRoom?.room?.capacity,
            roomPrice: firstRoom?.price_per_hour,
            room: firstRoom?.room
          };
        });

        return {
          ...response.data,
          data: bookingsWithRoom
        };
      }

      return response.data as ApiResponse<BookingWithRoom[]>;
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
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
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error(`Error cancelling booking ${id}:`, error);
      throw error;
    }
  },

  completeBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}/complete`);
      return response.data;
    } catch (error: any) {
      console.error(`Error completing booking ${id}:`, error);
      throw error;
    }
  },

  // Thêm các phương thức mới cho đặt nhiều phòng
  createMultipleBookings: async (
    customer_id: number,
    bookings: Omit<BookingInput, 'booking_group_id'>[]
  ): Promise<ApiResponse<{ booking_group: BookingGroup; bookings: Booking[] }>> => {
    try {
      console.log('Sending multiple bookings request:', {
        customer_id,
        bookings,
        endpoint: '/bookings/multiple'
      });

      const response = await api.post<ApiResponse<{ booking_group: BookingGroup; bookings: Booking[] }>>(
        '/bookings/multiple',
        {
          customer_id,
          bookings
        },
        {
          timeout: 15000, // Tăng timeout vì xử lý nhiều phòng
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Multiple bookings response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating multiple bookings:', error);

      // Cải thiện xử lý lỗi
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);

        // Nếu có thông báo lỗi từ server, sử dụng nó
        if (error.response.data?.message) {
          throw {
            success: false,
            message: error.response.data.message,
            error: error.response.data
          };
        }
      }

      // Lỗi mặc định
      throw {
        success: false,
        message: 'Lỗi khi đặt nhiều phòng',
        error: error
      };
    }
  },

  // Thêm phương thức fallback để sử dụng khi API multiple không hoạt động
  createBookingsSequentially: async (
    customer_id: number,
    bookings: Omit<BookingInput, 'booking_group_id'>[]
  ): Promise<ApiResponse<Booking[]>> => {
    try {
      console.log('Falling back to sequential booking creation');

      const createdBookings: Booking[] = [];

      // Tạo từng booking một
      for (const booking of bookings) {
        // Sử dụng bookingService trực tiếp thay vì this
        const response = await bookingService.createBooking(booking);
        if (response.success && response.data) {
          createdBookings.push(response.data);
        } else {
          throw new Error(response.message || 'Failed to create booking');
        }
      }

      return {
        success: true,
        message: 'Đặt phòng thành công',
        data: createdBookings
      };
    } catch (error: any) {
      console.error('Error in sequential booking creation:', error);
      throw {
        success: false,
        message: error.message || 'Lỗi khi đặt phòng',
        error: error
      };
    }
  },

  getBookingGroup: async (groupId: number): Promise<ApiResponse<BookingGroup>> => {
    try {
      const response = await api.get<ApiResponse<BookingGroup>>(`/booking-groups/${groupId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching booking group:', error);

      const errorResponse = {
        success: false,
        message: 'Lỗi khi lấy thông tin nhóm đặt phòng',
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

  getBookingsByGroup: async (groupId: number): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await api.get<ApiResponse<Booking[]>>(`/booking-groups/${groupId}/bookings`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bookings by group:', error);

      const errorResponse = {
        success: false,
        message: 'Lỗi khi lấy danh sách đặt phòng trong nhóm',
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

  updateBookingGroupStatus: async (
    groupId: number,
    status: string
  ): Promise<ApiResponse<BookingGroup>> => {
    try {
      const response = await api.put<ApiResponse<BookingGroup>>(
        `/booking-groups/${groupId}/status`,
        { status },
        {
          timeout: 10000
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating booking group status:', error);

      const errorResponse = {
        success: false,
        message: 'Lỗi khi cập nhật trạng thái nhóm đặt phòng',
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

  completeBookingGroup: async (
    groupId: number,
    endTime: Date,
    totalAmount: number,
    paymentMethod: string = 'cash',
    notes: string = ''
  ): Promise<ApiResponse<{ booking_group: BookingGroup; payment: any }>> => {
    try {
      console.log('Sending request to complete booking group:', {
        groupId,
        endTime: endTime.toISOString(),
        totalAmount,
        paymentMethod,
        notes
      });

      const response = await api.put<ApiResponse<{ booking_group: BookingGroup; payment: any }>>(
        `/booking-groups/${groupId}/complete`,
        {
          end_time: endTime.toISOString(),
          total_amount: totalAmount,
          payment_method: paymentMethod,
          notes
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // Tăng timeout vì xử lý nhiều phòng
        }
      );

      console.log('Response from server:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error completing booking group:', error);
      throw error;
    }
  },

  // Thêm các phương thức mới
  completeBookingWithPayment: async (
    id: number,
    endTime: Date,
    totalAmount: number,
    paymentMethod: string = 'cash',
    notes: string = ''
  ): Promise<ApiResponse<{booking: Booking, payment: any}>> => {
    try {
      console.log('Sending request to complete booking with payment:', {
        id,
        endTime: endTime.toISOString(),
        totalAmount,
        paymentMethod,
        notes
      });

      // Sử dụng endpoint mới
      const response = await api.post<ApiResponse<{booking: Booking, payment: any}>>(
        `/bookings/${id}/complete-with-payment`,
        {
          end_time: endTime.toISOString(),
          total_amount: totalAmount,
          payment_method: paymentMethod,
          notes
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Complete booking with payment response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error completing booking with payment:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi hoàn tất thanh toán',
        error
      };
    }
  },

  extendBooking: async (id: number, hours: number): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put<ApiResponse<Booking>>(
        `/bookings/${id}/extend`,
        {
          hours
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error extending booking:', error);
      throw error.response?.data || error;
    }
  },

  makePayment: async (
    id: number,
    amount: number,
    paymentStatus: 'unpaid' | 'partially_paid' | 'paid'
  ): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put<ApiResponse<Booking>>(
        `/bookings/${id}/payment`,
        {
          amount,
          payment_status: paymentStatus
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error making payment:', error);
      throw error.response?.data || error;
    }
  },

  getBookingById: async (id: number): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting booking:', error);
      throw error.response?.data || error;
    }
  },

  updatePaymentStatus: async (
    id: number,
    paymentStatus: 'unpaid' | 'partially_paid' | 'paid'
  ): Promise<ApiResponse<Booking>> => {
    try {
      console.log(`Updating payment status for booking #${id} to ${paymentStatus}`);

      const response = await api.put<ApiResponse<Booking>>(
        `/bookings/${id}/payment-status`,
        {
          payment_status: paymentStatus
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Payment status updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating payment status:', error);

      const errorResponse = {
        success: false,
        message: 'Không thể cập nhật trạng thái thanh toán',
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

  markAsPaid: async (id: number): Promise<ApiResponse<Booking>> => {
    try {
      console.log(`Marking booking #${id} as paid`);

      // Use the existing updateBooking method to update just the payment status
      const response = await api.put<ApiResponse<Booking>>(
        `/bookings/${id}`,
        {
          payment_status: 'paid'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Booking marked as paid:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error marking booking as paid:', error);

      const errorResponse = {
        success: false,
        message: 'Không thể cập nhật trạng thái thanh toán',
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

  recordPaymentAndUpdateStatus: async (
    bookingId: number,
    amount: number,
    paymentMethod: string = 'cash',
    notes: string = ''
  ): Promise<ApiResponse<{booking: Booking, payment: any}>> => {
    try {
      console.log(`Recording payment for booking #${bookingId}:`, {
        amount,
        paymentMethod,
        notes
      });

      // Create a payment record and update booking status in one request
      const response = await api.post<ApiResponse<{booking: Booking, payment: any}>>(
        `/bookings/${bookingId}/payment`,
        {
          amount,
          payment_method: paymentMethod,
          notes,
          payment_date: new Date().toISOString()
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Payment recorded and status updated:', response.data);

      // Thêm code để cập nhật cache hoặc state nếu cần

      return response.data;
    } catch (error: any) {
      console.error('Error recording payment:', error);

      const errorResponse = {
        success: false,
        message: 'Không thể ghi nhận thanh toán',
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

  recordPaymentAndUpdateStatusSeparately: async (
    bookingId: number,
    amount: number,
    paymentMethod: string = 'cash',
    notes: string = ''
  ): Promise<ApiResponse<{booking: Booking, payment: any}>> => {
    try {
      // First, create the payment record
      const paymentResponse = await api.post<ApiResponse<any>>(
        '/payments',
        {
          booking_id: bookingId,
          amount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          notes
        }
      );

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Failed to create payment record');
      }

      // Then, update the booking status
      const bookingResponse = await api.put<ApiResponse<Booking>>(
        `/bookings/${bookingId}`,
        {
          payment_status: 'paid'
        }
      );

      if (!bookingResponse.data.success) {
        throw new Error(bookingResponse.data.message || 'Failed to update booking status');
      }

      return {
        success: true,
        message: 'Thanh toán thành công và đã cập nhật trạng thái',
        data: {
          booking: bookingResponse.data.data,
          payment: paymentResponse.data.data
        }
      };
    } catch (error: any) {
      console.error('Error recording payment:', error);
      throw {
        success: false,
        message: error.message || 'Không thể ghi nhận thanh toán',
        error
      };
    }
  },

  confirmBooking: async (id: number): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put<ApiResponse<Booking>>(`/bookings/${id}/confirm`);
      return response.data;
    } catch (error: any) {
      console.error(`Error confirming booking ${id}:`, error);
      throw error;
    }
  },

  confirmBookingRoom: async (roomBookingId: number): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put<ApiResponse<any>>(`/booking-rooms/${roomBookingId}/confirm`);
      return response.data;
    } catch (error: any) {
      console.error(`Error confirming booking room ${roomBookingId}:`, error);
      throw error;
    }
  },

  cancelBookingRoom: async (roomBookingId: number): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put<ApiResponse<any>>(`/booking-rooms/${roomBookingId}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error(`Error cancelling booking room ${roomBookingId}:`, error);
      throw error;
    }
  }
};

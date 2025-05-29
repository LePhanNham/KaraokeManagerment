import { UnpaidBooking, PaymentData, PaymentResponse } from '../types/interfaces';

// Use existing booking API
const API_BASE_URL = 'http://localhost:5000';

class PaymentService {
  private async fetchAPI(url: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all unpaid bookings using new payment API
  async getUnpaidBookings(): Promise<UnpaidBooking[]> {
    try {
      // Use new payment API to get unpaid bookings
      const response = await this.fetchAPI('/api/payments/unpaid-bookings');
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching unpaid bookings:', error);
      throw new Error(error.message || 'Lỗi khi tải danh sách booking chưa thanh toán');
    }
  }

  // Get unpaid bookings for specific customer
  async getUnpaidBookingsByCustomer(customerId: number): Promise<UnpaidBooking[]> {
    try {
      const response = await this.fetchAPI(`/api/payments/unpaid-bookings/${customerId}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching customer unpaid bookings:', error);
      throw new Error(error.message || 'Lỗi khi tải booking chưa thanh toán của khách hàng');
    }
  }

  // Process payment using new payment API
  async processPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const response = await this.fetchAPI('/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });

      return {
        success: true,
        message: response.message || 'Thanh toán thành công',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error processing payment:', error);
      throw new Error(error.message || 'Lỗi khi xử lý thanh toán');
    }
  }

  // Process multiple payments in one transaction
  async processMultiplePayment(paymentItems: any[], paymentMethod: string, notes?: string): Promise<PaymentResponse> {
    try {
      const requestData = {
        payment_items: paymentItems,
        payment_method: paymentMethod,
        notes: notes
      };

      console.log('=== FRONTEND MULTIPLE PAYMENT ===');
      console.log('Sending multiple payment request:', requestData);

      const response = await this.fetchAPI('/api/payments/multiple', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      return {
        success: true,
        message: response.message || 'Thanh toán nhiều items thành công',
        data: response.data
      };
    } catch (error: any) {
      console.error('Error processing multiple payment:', error);
      throw new Error(error.message || 'Lỗi khi xử lý thanh toán nhiều items');
    }
  }

  // Get payment history
  async getPaymentHistory(customerId?: number): Promise<any[]> {
    try {
      const url = customerId
        ? `/api/payments/history/${customerId}`
        : '/api/payments/history';

      const response = await this.fetchAPI(url);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      throw new Error(error.message || 'Lỗi khi tải lịch sử thanh toán');
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId: number): Promise<any> {
    try {
      const response = await this.fetchAPI(`/api/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      throw new Error(error.message || 'Lỗi khi tải chi tiết thanh toán');
    }
  }

  // Utility functions
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(amount: number): string {
    return amount.toLocaleString('vi-VN') + 'đ';
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ tín dụng';
      case 'bank_transfer': return 'Chuyển khoản';
      default: return method;
    }
  }

  validatePaymentData(paymentData: PaymentData): string | null {
    if (!paymentData.booking_id && !paymentData.booking_group_id) {
      return 'Thiếu thông tin booking';
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return 'Số tiền thanh toán phải lớn hơn 0';
    }

    if (!paymentData.payment_method) {
      return 'Vui lòng chọn phương thức thanh toán';
    }

    return null;
  }

  // Calculate total amount for multiple bookings
  calculateTotalAmount(bookings: UnpaidBooking[]): number {
    return bookings.reduce((total, booking) => total + booking.total_amount, 0);
  }

  // Group bookings by customer
  groupBookingsByCustomer(bookings: UnpaidBooking[]): { [customerId: number]: UnpaidBooking[] } {
    return bookings.reduce((groups, booking) => {
      const customerId = booking.customer_id;
      if (!groups[customerId]) {
        groups[customerId] = [];
      }
      groups[customerId].push(booking);
      return groups;
    }, {} as { [customerId: number]: UnpaidBooking[] });
  }

  // Get booking status color
  getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  }

  // Get booking status label
  getStatusLabel(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'Đã xác nhận';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;

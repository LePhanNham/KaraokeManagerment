import { BookingWithRoom } from '../types/interfaces';

// Định nghĩa kiểu trạng thái thanh toán
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

// Hàm tính toán trạng thái thanh toán
export const calculatePaymentStatus = (booking: BookingWithRoom): PaymentStatus => {
  // Nếu không có total_amount hoặc total_amount = 0, không cần thanh toán
  if (!booking.total_amount || booking.total_amount <= 0) {
    return 'paid';
  }

  // Nếu booking đã hủy, không cần thanh toán
  if (booking.status === 'cancelled') {
    return 'paid';
  }

  // Sử dụng payment_status từ backend nếu có
  if (booking.payment_status) {
    return booking.payment_status;
  }

  // Fallback: tính toán dựa trên total_rooms và paid_rooms
  if (booking.total_rooms && booking.paid_rooms !== undefined) {
    if (booking.paid_rooms >= booking.total_rooms) {
      return 'paid';
    } else if (booking.paid_rooms > 0) {
      return 'partially_paid';
    } else {
      return 'unpaid';
    }
  }

  // Mặc định là chưa thanh toán
  return 'unpaid';
};

// Hàm kiểm tra xem trạng thái thanh toán có phải là "unpaid" không
export const isUnpaid = (status: PaymentStatus): boolean => {
  return status === 'unpaid';
};

// Hàm kiểm tra xem trạng thái thanh toán có phải là "partially_paid" không
export const isPartiallyPaid = (status: PaymentStatus): boolean => {
  return status === 'partially_paid';
};

// Hàm kiểm tra xem trạng thái thanh toán có phải là "paid" không
export const isPaid = (status: PaymentStatus): boolean => {
  return status === 'paid';
};

// Hàm kiểm tra xem trạng thái thanh toán có cần thanh toán thêm không
export const needsPayment = (status: PaymentStatus): boolean => {
  return status === 'unpaid' || status === 'partially_paid';
};


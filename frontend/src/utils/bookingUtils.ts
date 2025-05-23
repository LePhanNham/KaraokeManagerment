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
  
  // Giả lập kiểm tra thanh toán một phần (trong thực tế sẽ dựa vào dữ liệu từ API)
  // Ví dụ: nếu booking có id chẵn thì coi như đã thanh toán một phần
  if (booking.id && booking.id % 2 === 0) {
    return 'partially_paid';
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


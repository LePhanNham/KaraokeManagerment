import { BookingWithRoom } from '../types/interfaces';

// Định nghĩa kiểu trạng thái thanh toán
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

// Hàm tính toán trạng thái thanh toán
export const calculatePaymentStatus = (booking: BookingWithRoom): PaymentStatus => {
  // Nếu booking đã hủy, không cần thanh toán
  if (booking.status === 'cancelled') {
    return 'paid';
  }

  // Tính toán trạng thái thanh toán dựa trên các booking_room
  const confirmedRooms = booking.rooms?.filter(room => room.status === 'confirmed') || [];
  const paidRooms = confirmedRooms.filter(room => room.payment_status === 'paid').length;
  const totalConfirmedRooms = confirmedRooms.length;

  if (totalConfirmedRooms === 0) {
    // Nếu không có phòng nào được xác nhận, coi như chưa cần thanh toán
    return 'unpaid';
  }

  if (paidRooms >= totalConfirmedRooms) {
    return 'paid';
  } else if (paidRooms > 0) {
    return 'partially_paid';
  } else {
    return 'unpaid';
  }
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


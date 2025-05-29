
import { Router } from 'express';
import BookingController from '../controllers/bookingController';

const router = Router();
const bookingController = new BookingController();

// Đảm bảo route này được đăng ký đúng cách
router.post('/find-available-rooms', bookingController.findAvailableRooms.bind(bookingController));

// Các route khác (tạm thời bỏ auth để test)
router.post('/', bookingController.createBooking.bind(bookingController));
router.get('/', bookingController.getAllBookings.bind(bookingController));
router.get('/:id', bookingController.getBooking.bind(bookingController));
router.put('/:id', bookingController.updateBooking.bind(bookingController));
router.delete('/:id', bookingController.deleteBooking.bind(bookingController));

// Route cho đặt nhiều phòng
router.post('/multiple', bookingController.createMultipleBookings.bind(bookingController));

// Route cho gia hạn booking
router.put('/:id/extend', bookingController.extendBooking.bind(bookingController));

// Route cho hoàn tất đặt phòng và thanh toán
router.post('/:id/complete-with-payment', bookingController.completeBookingWithPayment.bind(bookingController));

export default router;

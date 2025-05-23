
import { Router } from 'express';
import BookingController from '../controllers/bookingController';
import { auth } from '../middlewares/authMiddleware';

const router = Router();
const bookingController = new BookingController();

// Đảm bảo route này được đăng ký đúng cách
router.get('/available', bookingController.findAvailableRooms.bind(bookingController));

// Các route khác
router.post('/', auth, bookingController.createBooking.bind(bookingController));
router.get('/', auth, bookingController.getAllBookings.bind(bookingController));
router.get('/:id', auth, bookingController.getBooking.bind(bookingController));
router.put('/:id', auth, bookingController.updateBooking.bind(bookingController));
router.delete('/:id', auth, bookingController.deleteBooking.bind(bookingController));

// Route cho đặt nhiều phòng
router.post('/multiple', auth, bookingController.createMultipleBookings.bind(bookingController));

// Route cho hoàn tất đặt phòng và thanh toán
router.post('/:id/complete-with-payment', auth, bookingController.completeBookingWithPayment.bind(bookingController));

// Route cho gia hạn đặt phòng
router.put('/:id/extend', auth, bookingController.extendBooking.bind(bookingController));

export default router;


import express from 'express';
import BookingController from '../controllers/bookingController';
import { auth, adminAuth } from '../middlewares/authMiddleware';

const router = express.Router();
const bookingController = new BookingController();

// Public route - anyone can check available rooms
router.get('/available', bookingController.findAvailableRooms.bind(bookingController));

// Protected routes - require authentication
router.post('/', auth, bookingController.createBooking.bind(bookingController));
router.get('/', auth, bookingController.getAllBookings.bind(bookingController));
router.get('/:id', auth, bookingController.getBooking.bind(bookingController));
router.put('/:id', auth, bookingController.updateBooking.bind(bookingController));
router.delete('/:id', auth, bookingController.deleteBooking.bind(bookingController));

export default router;

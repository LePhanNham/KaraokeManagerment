import { Router } from 'express';
import BookingRoomController from '../controllers/bookingRoomController';

const router = Router();
const bookingRoomController = new BookingRoomController();

router.put('/:id/confirm', bookingRoomController.confirmBookingRoom.bind(bookingRoomController));
router.put('/:id/cancel', bookingRoomController.cancelBookingRoom.bind(bookingRoomController));

export default router; 
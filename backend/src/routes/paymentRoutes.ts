import express from 'express';
import paymentController from '../controllers/paymentController';

const router = express.Router();

// Get all unpaid bookings
router.get('/unpaid-bookings', paymentController.getUnpaidBookings);

// Process payment
router.post('/', paymentController.processPayment);

// Process multiple payments in one transaction
router.post('/multiple', paymentController.processMultiplePayment);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);
router.get('/history/:customerId', paymentController.getPaymentHistory);

// Get payment details
router.get('/:paymentId', paymentController.getPaymentDetails);

// Debug utilities
router.get('/check-booking-room/:id', paymentController.checkBookingRoom);

// Database utilities
router.post('/drop-room-status', paymentController.dropRoomStatus);
router.post('/fix-null-times', paymentController.fixNullTimes);

export default router;

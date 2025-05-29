import { Request, Response } from 'express';
import PaymentService from '../services/paymentService';

const paymentService = new PaymentService();

class PaymentController {
  // Get all unpaid bookings
  async getUnpaidBookings(req: Request, res: Response) {
    try {
      const unpaidBookings = await paymentService.getUnpaidBookings();

      res.json({
        success: true,
        message: 'Lấy danh sách booking chưa thanh toán thành công',
        data: unpaidBookings
      });
    } catch (error: any) {
      console.error('Error getting unpaid bookings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách booking chưa thanh toán'
      });
    }
  }

  // Process payment
  async processPayment(req: Request, res: Response) {
    try {
      const paymentData = req.body;

      console.log('=== PAYMENT CONTROLLER DEBUG ===');
      console.log('Received payment data:', paymentData);

      // Validate payment data
      const validationError = paymentService.validatePaymentData(paymentData);
      if (validationError) {
        console.log('Validation error:', validationError);
        return res.status(400).json({
          success: false,
          message: validationError
        });
      }

      console.log('Processing payment...');
      const result = await paymentService.processPayment(paymentData);
      console.log('Payment result:', result);

      res.json({
        success: true,
        message: 'Thanh toán thành công',
        data: result
      });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý thanh toán'
      });
    }
  }

  // Process multiple payments in one transaction
  async processMultiplePayment(req: Request, res: Response) {
    try {
      const { payment_items, payment_method, notes } = req.body;

      console.log('=== MULTIPLE PAYMENT CONTROLLER DEBUG ===');
      console.log('Received multiple payment data:', { payment_items, payment_method, notes });

      // Validate input
      if (!payment_items || !Array.isArray(payment_items) || payment_items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách thanh toán không hợp lệ'
        });
      }

      if (!payment_method) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn phương thức thanh toán'
        });
      }

      // Validate each payment item
      for (const item of payment_items) {
        if (!item.booking_id || !item.amount || item.amount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Thông tin thanh toán không hợp lệ'
          });
        }
      }

      console.log('Processing multiple payment...');
      const result = await paymentService.processMultiplePayment(payment_items, payment_method, notes);
      console.log('Multiple payment result:', result);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {
      console.error('Error processing multiple payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý thanh toán nhiều items'
      });
    }
  }

  // Get payment history
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const customerId = req.params.customerId ? parseInt(req.params.customerId) : undefined;
      const { page = 1, limit = 10 } = req.query;

      const payments = await paymentService.getPaymentHistory(
        customerId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Lấy lịch sử thanh toán thành công',
        data: payments
      });
    } catch (error: any) {
      console.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy lịch sử thanh toán'
      });
    }
  }

  // Get payment details
  async getPaymentDetails(req: Request, res: Response) {
    try {
      const paymentId = parseInt(req.params.paymentId);

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID không hợp lệ'
        });
      }

      const payment = await paymentService.getPaymentDetails(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }

      res.json({
        success: true,
        message: 'Lấy chi tiết thanh toán thành công',
        data: payment
      });
    } catch (error: any) {
      console.error('Error getting payment details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy chi tiết thanh toán'
      });
    }
  }

  // Check specific booking_room record (debug utility)
  async checkBookingRoom(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID không hợp lệ'
        });
      }

      console.log('=== CHECKING BOOKING ROOM ===');
      console.log('Checking booking_room ID:', id);

      const result = await paymentService.checkBookingRoom(id);
      console.log('Check result:', result);

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error: any) {
      console.error('Error checking booking room:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi kiểm tra booking room'
      });
    }
  }

  // Drop status column from rooms table (one-time utility)
  async dropRoomStatus(req: Request, res: Response) {
    try {
      console.log('=== DROPPING ROOM STATUS COLUMN ===');

      const result = await paymentService.dropRoomStatusColumn();
      console.log('Drop result:', result);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {
      console.error('Error dropping room status column:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xóa cột status'
      });
    }
  }

  // Fix NULL times in booking_rooms (temporary utility)
  async fixNullTimes(req: Request, res: Response) {
    try {
      console.log('=== FIXING NULL TIMES ===');
      const result = await paymentService.fixNullTimes();
      console.log('Fix result:', result);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {
      console.error('Error fixing NULL times:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi sửa thời gian NULL'
      });
    }
  }
}

const paymentController = new PaymentController();
export default paymentController;

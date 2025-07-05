import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';

class BookingRoomController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  public async confirmBookingRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.bookingService.updateBookingRoomStatus(Number(id), 'confirmed');
      res.status(200).json({ success: true, message: `Booking room ${id} confirmed successfully.` });
    } catch (error: any) {
      console.error('Error confirming booking room:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to confirm booking room.' });
    }
  }

  public async cancelBookingRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.bookingService.updateBookingRoomStatus(Number(id), 'cancelled');
      res.status(200).json({ success: true, message: `Booking room ${id} cancelled successfully.` });
    } catch (error: any) {
      console.error('Error cancelling booking room:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to cancel booking room.' });
    }
  }
}

export default BookingRoomController; 
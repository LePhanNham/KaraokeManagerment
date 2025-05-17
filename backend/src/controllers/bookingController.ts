import { Request, Response } from 'express';
import BookingService from '../services/bookingService';
import RoomService from '../services/roomService';
import { Booking } from '../models/Booking';

class BookingController {
    private bookingService: BookingService;
    private roomService: RoomService;

    constructor() {
        this.bookingService = new BookingService();
        this.roomService = new RoomService();
    }

    async findAvailableRooms(req: Request, res: Response) {
        try {
            const start_time = req.query.start_time || req.body.start_time;
            const end_time = req.query.end_time || req.body.end_time;

            console.log('Received dates:', { start_time, end_time });

            if (!start_time || !end_time) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Thời gian bắt đầu và kết thúc là bắt buộc' 
                });
            }

            const startDate = new Date(start_time as string);
            const endDate = new Date(end_time as string);
            const now = new Date();

            // Add debug logging for parsed dates
            console.log('Parsed dates:', { 
                startDate: startDate.toISOString(), 
                endDate: endDate.toISOString() 
            });

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng thời gian không hợp lệ',
                    debug: { start_time, end_time }
                });
            }

            if (startDate >= endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc',
                    debug: { 
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    }
                });
            }

            const availableRooms = await this.bookingService.findAvailableRooms(
                startDate,
                endDate
            );

            if (!Array.isArray(availableRooms)) {
                throw new Error('Invalid response from booking service');
            }

            return res.json({
                success: true,
                message: 'Tìm thấy phòng trống',
                data: availableRooms,
                meta: {
                    start_time: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    total_rooms: availableRooms.length
                }
            });

        } catch (error) {
            console.error('Error finding available rooms:', error);
            
            // Improve error response
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm phòng trống',
                error: errorMessage,
                debug: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }

     async createBooking(req: Request, res: Response) {
        try {
            const { room_id, customer_id, start_time, end_time, notes, total_amount } = req.body;
            
            if (!room_id || !customer_id || !start_time || !end_time) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Thiếu thông tin bắt buộc' 
                });
            }

            console.log('Received dates:', { start_time, end_time });

            const startDate = new Date(start_time);
            const endDate = new Date(end_time);

            console.log('Parsed dates:', { 
                startDate, 
                endDate,
                startLocal: startDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                endLocal: endDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
            });

            const booking = await this.bookingService.createBooking({
                room_id,
                customer_id,
                start_time: startDate,
                end_time: endDate,
                notes: notes || '',
                status: 'pending', // Luôn sử dụng 'pending'
                total_amount: total_amount || 0
            });

            return res.status(201).json({
                success: true,
                data: booking,
                message: 'Đặt phòng thành công'
            });

        } catch (error) {
            console.error('Error creating booking:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }


    async getAllBookings(req: Request, res: Response) {
        try {
            const bookings = await this.bookingService.getAllBookings();
            return res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            console.error('Error getting bookings:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tải danh sách đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getBooking(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đặt phòng'
                });
            }

            return res.json({
                success: true,
                data: booking
            });
        } catch (error) {
            console.error('Error getting booking:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tải thông tin đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async updateBooking(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đặt phòng'
                });
            }

            const updatedBooking = await this.bookingService.updateBooking(bookingId, req.body);
            return res.json({
                success: true,
                data: updatedBooking,
                message: 'Cập nhật đặt phòng thành công'
            });
        } catch (error) {
            console.error('Error updating booking:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async deleteBooking(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid booking ID'
                });
            }

            const success = await this.bookingService.deleteBooking(bookingId);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            res.json({
                success: true,
                message: 'Booking deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting booking:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete booking'
            });
        }
    }
}

export default BookingController;



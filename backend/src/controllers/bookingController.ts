import { Request, Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import BookingService from '../services/bookingService';
import PaymentService from '../services/paymentService';
import dbConfig from '../config/database';

// Interfaces cho request data
interface CreateBookingDTO {
    customer_id: number;
    rooms: {
        room_id: number;
        start_time: Date;
        end_time: Date;
        price_per_hour: number;
    }[];
    total_amount?: number;
    notes?: string;
}

interface CompleteBookingDTO {
    bookingId: number;
    endTime: Date;
    totalAmount: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    notes?: string;
}

export class BookingController {
    private bookingService: BookingService;
    private paymentService: PaymentService;

    constructor() {
        this.bookingService = new BookingService();
        this.paymentService = new PaymentService();
    }

    async findAvailableRooms(req: Request, res: Response) {
        try {
            console.log('findAvailableRooms called with body:', req.body);

            const start_time = req.body.start_time as string;
            const end_time = req.body.end_time as string;

            console.log('Received dates:', { start_time, end_time });

            if (!start_time || !end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Thời gian bắt đầu và kết thúc là bắt buộc',
                    debug: { body: req.body }
                });
            }

            // Chuyển đổi chuỗi thời gian thành đối tượng Date
            const startDate = new Date(start_time);
            const endDate = new Date(end_time);

            console.log('Parsed dates:', {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            // Kiểm tra tính hợp lệ của thời gian
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
                error: errorMessage
            });
        }
    }

    async createBooking(req: Request, res: Response) {
        try {
            console.log('Creating booking with data:', JSON.stringify(req.body, null, 2));

            const { customer_id, bookings, total_amount, notes } = req.body;

            if (!customer_id) {
                return res.status(400).json({
                    success: false,
                    message: 'customer_id is required'
                });
            }

            if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'bookings array is required and must not be empty'
                });
            }

            const bookingData: CreateBookingDTO = {
                customer_id,
                rooms: bookings.map((booking: any) => ({
                    room_id: booking.room_id,
                    start_time: new Date(booking.start_time),
                    end_time: new Date(booking.end_time),
                    price_per_hour: booking.price_per_hour
                })),
                total_amount,
                notes
            };

            // Validate dates
            for (const room of bookingData.rooms) {
                if (room.start_time >= room.end_time) {
                    return res.status(400).json({
                        success: false,
                        message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc'
                    });
                }
            }

            const booking = await this.bookingService.createBooking(bookingData);

            return res.status(201).json({
                success: true,
                message: 'Đặt phòng thành công',
                data: booking
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

    async getBookingDetails(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            const booking = await this.bookingService.getBookingDetails(bookingId);

            return res.json({
                success: true,
                data: booking
            });
        } catch (error) {
            console.error('Error getting booking details:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async completeBookingWithPayment(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            const { end_time, total_amount, payment_method, notes } = req.body;

            const result = await this.bookingService.completeBookingWithPayment({
                bookingId,
                endTime: new Date(end_time),
                totalAmount: total_amount,
                paymentMethod: payment_method,
                notes
            });

            return res.json({
                success: true,
                data: result,
                message: 'Trả phòng và thanh toán thành công'
            });

        } catch (error) {
            console.error('Error completing booking with payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi hoàn tất thanh toán',
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
            console.error('Error getting all bookings:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách đặt phòng',
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
                message: 'Lỗi khi lấy thông tin đặt phòng',
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

            const updateData = req.body;
            const booking = await this.bookingService.updateBooking(bookingId, updateData);

            return res.json({
                success: true,
                data: booking,
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
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            await this.bookingService.deleteBooking(bookingId);

            return res.json({
                success: true,
                message: 'Xóa đặt phòng thành công'
            });
        } catch (error) {
            console.error('Error deleting booking:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async createMultipleBookings(req: Request, res: Response) {
        try {
            const { customer_id, rooms, notes } = req.body;

            if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh sách phòng không hợp lệ'
                });
            }

            const bookingData: CreateBookingDTO = {
                customer_id,
                rooms: rooms.map((room: any) => ({
                    room_id: room.room_id,
                    start_time: new Date(room.start_time),
                    end_time: new Date(room.end_time),
                    price_per_hour: room.price_per_hour
                })),
                notes
            };

            const booking = await this.bookingService.createBooking(bookingData);

            return res.status(201).json({
                success: true,
                message: 'Đặt nhiều phòng thành công',
                data: booking
            });
        } catch (error) {
            console.error('Error creating multiple bookings:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi đặt nhiều phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async extendBooking(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            const { new_end_time } = req.body;
            if (!new_end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Thời gian kết thúc mới là bắt buộc'
                });
            }

            const newEndTime = new Date(new_end_time);
            if (isNaN(newEndTime.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng thời gian không hợp lệ'
                });
            }

            const result = await this.bookingService.extendBooking(bookingId, newEndTime);

            return res.json({
                success: true,
                data: result,
                message: 'Gia hạn đặt phòng thành công'
            });
        } catch (error) {
            console.error('Error extending booking:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi gia hạn đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export default BookingController;



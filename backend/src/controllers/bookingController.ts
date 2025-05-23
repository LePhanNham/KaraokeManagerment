import { Request, Response } from 'express';
import BookingService from '../services/bookingService';
import PaymentService from '../services/paymentService';
import database from '../config/database';
import { Pool, RowDataPacket } from 'mysql2/promise';

export class BookingController {
    private bookingService: BookingService;
    private paymentService: PaymentService;
    private db: Pool;

    constructor() {
        this.bookingService = new BookingService();
        this.paymentService = new PaymentService();
        this.db = database.getPool();
    }

    async findAvailableRooms(req: Request, res: Response) {
        try {
            console.log('findAvailableRooms called with query:', req.query);
            
            const start_time = req.query.start_time as string;
            const end_time = req.query.end_time as string;

            console.log('Received dates:', { start_time, end_time });

            if (!start_time || !end_time) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Thời gian bắt đầu và kết thúc là bắt buộc',
                    debug: { query: req.query }
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
            const id = req.params.id;
            
            // Kiểm tra id có phải là số không
            const bookingId = parseInt(id, 10);
            
            if (isNaN(bookingId)) {
                console.log(`Invalid booking ID: "${id}" is not a number`);
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
                message: 'Tìm thấy đặt phòng',
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
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID không hợp lệ'
                });
            }

            // Log request body để debug
            console.log('Update booking request body:', req.body);

            // Kiểm tra xem đây có phải là yêu cầu thanh toán không
            const isPaymentRequest = req.body.is_payment_request === true;
            
            // Xóa trường is_payment_request khỏi dữ liệu cập nhật
            const { is_payment_request, payment_method, notes, ...updateData } = req.body;

            console.log('Update data after processing:', updateData);
            
            // Cập nhật booking
            const updatedBooking = await this.bookingService.updateBooking(id, updateData);
            console.log('Updated booking:', updatedBooking);
            
            // Nếu là yêu cầu thanh toán, tạo bản ghi thanh toán
            if (isPaymentRequest && updateData.status === 'completed' && updateData.total_amount) {
                try {
                    console.log('Creating payment for booking:', id);
                    const payment = await this.paymentService.createPayment({
                        booking_id: id,
                        amount: updateData.total_amount,
                        payment_method: payment_method || 'cash',
                        payment_date: new Date(),
                        notes: notes || ''
                    });
                    
                    console.log('Payment created:', payment);
                    
                    return res.json({
                        success: true,
                        data: {
                            booking: updatedBooking,
                            payment: payment
                        },
                        message: 'Trả phòng và thanh toán thành công'
                    });
                } catch (paymentError) {
                    console.error('Error creating payment:', paymentError);
                    // Vẫn trả về booking đã cập nhật ngay cả khi thanh toán thất bại
                    return res.json({
                        success: true,
                        data: updatedBooking,
                        message: 'Đã cập nhật đặt phòng nhưng có lỗi khi tạo bản ghi thanh toán'
                    });
                }
            }

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

    async createMultipleBookings(req: Request, res: Response) {
        try {
            const { customer_id, bookings } = req.body;
            
            console.log('Received createMultipleBookings request:', {
                customer_id,
                bookings: Array.isArray(bookings) ? bookings.length : 'not an array',
                body: req.body
            });
            
            if (!customer_id || !bookings || !Array.isArray(bookings) || bookings.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Thiếu thông tin bắt buộc hoặc danh sách phòng trống' 
                });
            }
            
            // Validate all bookings
            for (const booking of bookings) {
                const { room_id, start_time, end_time } = booking;
                
                if (!room_id || !start_time || !end_time) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Thiếu thông tin bắt buộc cho một hoặc nhiều phòng' 
                    });
                }
                
                const startDate = new Date(start_time);
                const endDate = new Date(end_time);
                
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
            }
            
            // Create booking group
            const bookingGroup = await this.bookingService.createBookingGroup({ customer_id });
            
            // Prepare booking data with parsed dates
            const bookingsData = bookings.map(booking => ({
                ...booking,
                customer_id,
                start_time: new Date(booking.start_time),
                end_time: new Date(booking.end_time)
            }));
            
            // Create all bookings in the group
            const createdBookings = await this.bookingService.createMultipleBookings(
                bookingGroup.id as number,
                bookingsData
            );
            
            return res.status(201).json({
                success: true,
                data: {
                    booking_group: bookingGroup,
                    bookings: createdBookings
                },
                message: 'Đặt nhiều phòng thành công'
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

    async completeBookingWithPayment(req: Request, res: Response) {
        try {
            const bookingId = parseInt(req.params.id);
            if (isNaN(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID đặt phòng không hợp lệ'
                });
            }

            console.log('Complete booking with payment request:', {
                id: bookingId,
                body: req.body
            });

            const { end_time, total_amount, payment_method, notes } = req.body;

            // Get the booking to check if it exists
            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đặt phòng'
                });
            }

            const checkoutTime = new Date(end_time);
            
            // Tính toán số tiền thanh toán nếu không được cung cấp hoặc không hợp lệ
            let paymentAmount = parseFloat(total_amount);
            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                // Lấy thông tin phòng để tính giá
                const [roomInfoResult] = await this.db.execute(
                    'SELECT price_per_hour FROM rooms WHERE id = ?',
                    [booking.room_id]
                );
                
                // Chuyển đổi kiểu dữ liệu
                const roomInfoRows = roomInfoResult as RowDataPacket[];
                const pricePerHour = roomInfoRows.length > 0 ? Number(roomInfoRows[0].price_per_hour) : 0;
                
                // Tính số giờ sử dụng
                const startTime = new Date(booking.start_time);
                const hoursUsed = Math.ceil((checkoutTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
                
                // Tính tổng tiền
                paymentAmount = hoursUsed * pricePerHour;
                
                console.log('Calculated payment amount:', {
                    startTime,
                    checkoutTime,
                    hoursUsed,
                    pricePerHour,
                    paymentAmount
                });
            }
            
            // Create payment record
            console.log('Creating payment with data:', {
                booking_id: bookingId,
                amount: paymentAmount,
                payment_method: payment_method || 'cash',
                payment_date: new Date(),
                notes: notes || ''
            });
            
            const payment = await this.paymentService.createPayment({
                booking_id: bookingId,
                amount: paymentAmount,
                payment_method: payment_method || 'cash',
                payment_date: new Date(),
                notes: notes || ''
            });
            
            console.log('Payment created:', payment);

            // Update booking status
            const updatedBooking = await this.bookingService.updateBooking(bookingId, {
                status: 'completed',
                end_time: checkoutTime,
                total_amount: paymentAmount
            });
            
            console.log('Booking updated:', updatedBooking);

            return res.json({
                success: true,
                data: {
                    booking: updatedBooking,
                    payment: payment
                },
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

    async extendBooking(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { end_time, total_amount } = req.body;
            
            if (!id || !end_time || !total_amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết'
                });
            }
            
            // Cập nhật thời gian kết thúc và tổng tiền
            const updatedBooking = await this.bookingService.updateBooking(Number(id), {
                end_time,
                total_amount
            });
            
            return res.status(200).json({
                success: true,
                message: 'Gia hạn thành công',
                data: updatedBooking
            });
        } catch (error) {
            console.error('Error extending booking:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi gia hạn',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async makePayment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { amount, payment_status } = req.body;
            
            if (!id || !amount || !payment_status) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin cần thiết'
                });
            }
            
            // Lấy thông tin booking hiện tại
            const booking = await this.bookingService.getBookingById(Number(id));
            if (!booking)
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đặt phòng'
                });
            
            // Cập nhật thông tin thanh toán
            const updatedBooking = await this.bookingService.updateBooking(Number(id), {
                total_amount: booking.total_amount! + amount,
            });
            
            return res.status(200).json({
                success: true,
                message: 'Thanh toán thành công',
                data: updatedBooking
            });
        } catch (error) {
            console.error('Error making payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi thanh toán',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async completeBookingGroup(req: Request, res: Response) {
        try {
            const groupId = parseInt(req.params.id);
            if (isNaN(groupId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID nhóm đặt phòng không hợp lệ'
                });
            }

            console.log('Complete booking group request:', {
                groupId,
                body: req.body
            });

            const { end_time, total_amount, payment_method, notes } = req.body;

            if (!end_time || total_amount === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin thanh toán bắt buộc'
                });
            }

            const checkoutTime = new Date(end_time);

            // Cập nhật trạng thái nhóm booking và tất cả các booking trong nhóm
            const updatedGroup = await this.bookingService.completeBookingGroup(groupId, checkoutTime);
            console.log('Updated booking group:', updatedGroup);

            // Tạo bản ghi thanh toán cho nhóm
            const payment = await this.paymentService.createGroupPayment({
                booking_group_id: groupId,
                amount: total_amount,
                payment_method: payment_method || 'cash',
                payment_date: new Date(),
                notes: notes || ''
            });
            console.log('Created group payment:', payment);

            return res.json({
                success: true,
                data: {
                    booking_group: updatedGroup,
                    payment: payment
                },
                message: 'Thanh toán nhóm đặt phòng thành công'
            });
        } catch (error) {
            console.error('Error completing booking group:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi thanh toán nhóm đặt phòng',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async recordPayment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { amount, payment_method, notes, payment_date, complete_booking, end_time } = req.body;
            
            console.log('recordPayment called with:', { 
                id, 
                amount, 
                payment_method, 
                notes, 
                payment_date,
                complete_booking,
                end_time
            });
            
            if (!id || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin thanh toán bắt buộc'
                });
            }
            
            const bookingId = parseInt(id);
            
            // Get the booking to check if it exists
            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đặt phòng'
                });
            }
            
            // Create payment record with detailed logging
            console.log('Creating payment with data:', {
                booking_id: bookingId,
                amount: amount,
                payment_method: payment_method || 'cash',
                payment_date: payment_date ? new Date(payment_date) : new Date(),
                notes: notes || 'Thanh toán đặt phòng'
            });
            
            const payment = await this.paymentService.createPayment({
                booking_id: bookingId,
                amount: amount,
                payment_method: payment_method || 'cash',
                payment_date: payment_date ? new Date(payment_date) : new Date(),
                notes: notes || 'Thanh toán đặt phòng'
            });
            
            console.log('Payment created:', payment);
            
            // Verify payment was created
            if (!payment || !payment.id) {
                throw new Error('Payment creation failed');
            }
            
            // Update booking status if complete_booking flag is set
            let updatedBooking = booking;
            if (complete_booking) {
                const updateData: any = {
                    status: 'completed',
                    payment_status: 'paid'
                };
                
                if (end_time) {
                    updateData.end_time = new Date(end_time);
                }
                
                updatedBooking = await this.bookingService.updateBooking(bookingId, updateData);
                console.log('Booking completed:', updatedBooking);
            }
            
            return res.json({
                success: true,
                data: {
                    booking: updatedBooking,
                    payment: payment
                },
                message: 'Thanh toán thành công'
            });
        } catch (error) {
            console.error('Error recording payment:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi ghi nhận thanh toán',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export default BookingController;



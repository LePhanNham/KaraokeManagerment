import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';  // Import Room interface
import database from '../config/database';

interface BookingRow extends RowDataPacket, Booking {}

class BookingService {
    private db: Pool;

    constructor() {
        this.db = database.getPool();
    }

    private formatDateForMySQL(date: Date): string {
        // Create a new Date object to avoid modifying the original
        const localDate = new Date(date);
        
        // Format date to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        // using local time components
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const seconds = String(localDate.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
        try {
            console.log('Creating booking with data:', bookingData);
            console.log('Original date objects:', {
                start: bookingData.start_time,
                end: bookingData.end_time,
                startType: typeof bookingData.start_time,
                endType: typeof bookingData.end_time
            });

            // Format dates for MySQL
            const formattedStartTime = this.formatDateForMySQL(bookingData.start_time as Date);
            const formattedEndTime = this.formatDateForMySQL(bookingData.end_time as Date);

            console.log('Formatted dates for MySQL:', {
                start: formattedStartTime,
                end: formattedEndTime,
                originalStart: bookingData.start_time,
                originalEnd: bookingData.end_time
            });

            // Đảm bảo status là một trong các giá trị hợp lệ
            const validStatus = 'pending'; // Luôn sử dụng 'pending' để đảm bảo không có lỗi

            // Sử dụng prepared statement với thứ tự cột chính xác
            const [result] = await this.db.execute<ResultSetHeader>(
                `INSERT INTO bookings 
                (room_id, customer_id, start_time, end_time, status, total_amount, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    bookingData.room_id,
                    bookingData.customer_id,
                    formattedStartTime,
                    formattedEndTime,
                    validStatus, 
                    bookingData.total_amount || 0,
                    bookingData.notes || ''
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('Failed to create booking');
            }

            // Fetch and return the created booking
            const [rows] = await this.db.execute<BookingRow[]>(
                'SELECT * FROM bookings WHERE id = ?',
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            console.error('Error in createBooking:', error);
            throw error;
        }
    }

    async getBookingById(id: number): Promise<Booking | null> {
        try {
            const [rows] = await this.db.execute<BookingRow[]>(
                'SELECT * FROM bookings WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get booking: ${error.message}`);
            }
            throw new Error('Failed to get booking: Unknown error');
        }
    }

    async updateBooking(id: number, updateData: Partial<Booking>): Promise<Booking> {
        try {
            // Xử lý định dạng ngày tháng nếu có
            if (updateData.start_time instanceof Date) {
                updateData.start_time = this.formatDateForMySQL(updateData.start_time) as any;
            }
            
            if (updateData.end_time instanceof Date) {
                updateData.end_time = this.formatDateForMySQL(updateData.end_time) as any;
            } else if (typeof updateData.end_time === 'string' && (updateData.end_time as string).indexOf('Z') !== -1) {
                // Xử lý chuỗi ISO datetime với múi giờ
                updateData.end_time = this.formatDateForMySQL(new Date(updateData.end_time)) as any;
            }
            
            const setClause = Object.keys(updateData)
                .map(key => `${key} = ?`)
                .join(', ');
            
            await this.db.execute(
                `UPDATE bookings SET ${setClause} WHERE id = ?`,
                [...Object.values(updateData), id]
            );

            const booking = await this.getBookingById(id);
            if (!booking) {
                throw new Error('Booking not found after update');
            }
            return booking;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update booking: ${error.message}`);
            }
            throw new Error('Failed to update booking: Unknown error');
        }
    }

    async deleteBooking(id: number): Promise<boolean> {
        try {
            const [result] = await this.db.execute<ResultSetHeader>(
                'DELETE FROM bookings WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete booking: ${error.message}`);
            }
            throw new Error('Failed to delete booking: Unknown error');
        }
    }

    async getAllBookings(): Promise<Booking[]> {
        try {
            const [rows] = await this.db.execute<BookingRow[]>(`
                SELECT 
                    b.*,
                    r.name as room_name,
                    r.type as room_type,
                    r.price_per_hour,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone_number as customer_phone
                FROM bookings b
                LEFT JOIN rooms r ON b.room_id = r.id
                LEFT JOIN customers c ON b.customer_id = c.id
                ORDER BY b.start_time DESC
            `);

            return rows.map(row => ({
                id: row.id,
                room_id: row.room_id,
                customer_id: row.customer_id,
                start_time: row.start_time,
                end_time: row.end_time,
                status: row.status,
                total_amount: row.total_amount,
                notes: row.notes,
                created_at: row.created_at,
                updated_at: row.updated_at,
                room_name: row.room_name,
                room_type: row.room_type,
                price_per_hour: row.price_per_hour,
                customer_name: row.customer_name,
                customer_email: row.customer_email,
                customer_phone: row.customer_phone
            }));
        } catch (error) {
            console.error('Error in getAllBookings:', error);
            throw new Error(`Failed to get all bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findAvailableRooms(
        startTime: Date, 
        endTime: Date,
    ) {
        try {
            let query = `
                SELECT r.* 
                FROM rooms r
                WHERE r.id NOT IN (
                    SELECT b.room_id
                    FROM bookings b
                    WHERE b.status IN ('pending', 'confirmed')
                    AND (
                        (b.start_time < ? AND b.end_time > ?)
                        OR (b.start_time < ? AND b.end_time > ?)
                        OR (b.start_time >= ? AND b.end_time <= ?)
                    )
                )
                ORDER BY r.price_per_hour ASC, r.name ASC
            `;
            
            const queryParams: (Date | string | number)[] = [
                endTime, startTime,
                endTime, startTime,
                startTime, endTime
            ];

            const [rows] = await this.db.execute(query, queryParams);

            return (rows as any[]).map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                price_per_hour: Number(row.price_per_hour),
                capacity: Number(row.capacity),
                created_at: row.created_at ? new Date(row.created_at) : undefined,
                updated_at: row.updated_at ? new Date(row.updated_at) : undefined
            }));

        } catch (error) {
            console.error('Error finding available rooms:', error);
            throw new Error('Failed to find available rooms');
        }
    }

    async isRoomAvailable(roomId: number, startTime: Date, endTime: Date): Promise<boolean> {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM bookings
                WHERE room_id = ?
                AND (
                    (start_time < ? AND end_time > ?)
                    OR (start_time < ? AND end_time > ?)
                    OR (start_time >= ? AND end_time <= ?)
                )
            `;

            const [result] = await this.db.execute(query, [
                roomId,
                endTime,
                startTime,
                endTime,
                startTime,
                startTime,
                endTime
            ]);

            return (result as any)[0].count === 0;
        } catch (error) {
            console.error('Error checking room availability:', error);
            throw error;
        }
    }

    async isTimeSlotOverlapping(roomId: number, startTime: Date, endTime: Date): Promise<boolean> {
        const query = `
            SELECT COUNT(*) as overlap_count
            FROM bookings
            WHERE room_id = ?
            AND status NOT IN ('cancelled', 'completed')
            AND ? < end_time 
            AND ? > start_time
        `;

        const [result] = await this.db.execute<RowDataPacket[]>(query, [
            roomId,
            startTime,
            endTime
        ]);

        return (result[0] as any).overlap_count > 0;
    }

    // Thêm hàm để tự động cập nhật trạng thái booking và phòng theo thời gian
    async updateBookingStatusByTime(): Promise<void> {
        try {
            const now = new Date();
            
            // 1. Find bookings that have ended (confirmed bookings with end_time in the past)
            const [expiredBookings] = await this.db.execute<BookingRow[]>(
                `SELECT b.*, r.id as room_id 
                 FROM bookings b
                 JOIN rooms r ON b.room_id = r.id
                 WHERE b.status = 'confirmed' 
                 AND b.end_time < ?`,
                [now]
            );
            
            // 2. Update these bookings to completed
            for (const booking of expiredBookings) {
                if (booking.id !== undefined) {
                    await this.updateBooking(booking.id, { status: 'completed' });
                }
            }
            
            // 3. Find active bookings (confirmed bookings where start_time <= now < end_time)
            const [activeBookings] = await this.db.execute<BookingRow[]>(
                `SELECT b.*, r.id as room_id
                 FROM bookings b
                 JOIN rooms r ON b.room_id = r.id
                 WHERE b.status = 'confirmed' 
                 AND b.start_time <= ?
                 AND b.end_time > ?`,
                [now, now]
            );
            
            console.log(`Found ${activeBookings.length} active bookings`);
            
        } catch (error) {
            console.error('Error updating booking status by time:', error);
            throw new Error('Failed to update booking status by time');
        }
    }

    // Add this method to handle completing a booking and updating room status
    async completeBooking(id: number, endTime?: Date, totalAmount?: number): Promise<Booking> {
        try {
            // Get the booking to find the room_id
            const booking = await this.getBookingById(id);
            if (!booking) {
                throw new Error('Booking not found');
            }

            // Prepare update data
            const updateData: Partial<Booking> = {
                status: 'completed'
            };
            
            if (endTime) {
                updateData.end_time = this.formatDateForMySQL(endTime) as any;
            }
            
            if (totalAmount !== undefined) {
                updateData.total_amount = totalAmount;
            }
            
            // Update the booking
            const updatedBooking = await this.updateBooking(id, updateData);
            
            return updatedBooking;
        } catch (error) {
            console.error('Error completing booking:', error);
            throw error;
        }
    }
}

export default BookingService;
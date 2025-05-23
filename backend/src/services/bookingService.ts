import { Pool, RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { BookingGroup } from '../models/BookingGroup';
import database from '../config/database';

interface BookingRow extends RowDataPacket, Booking {}
interface BookingGroupRow extends RowDataPacket, BookingGroup {}

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

    async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking> {
        try {
            console.log(`Updating booking ${id} with data:`, bookingData);
            
            // Chuẩn bị các cặp key-value cho câu lệnh UPDATE
            const updateFields: string[] = [];
            const updateValues: any[] = [];
            
            for (const [key, value] of Object.entries(bookingData)) {
                if (value !== undefined) {
                    // Xử lý đặc biệt cho các trường ngày tháng
                    if (key === 'start_time' || key === 'end_time') {
                        if (value instanceof Date) {
                            updateFields.push(`${key} = ?`);
                            updateValues.push(this.formatDateForMySQL(value));
                        } else if (typeof value === 'string') {
                            updateFields.push(`${key} = ?`);
                            updateValues.push(value);
                        }
                    } else {
                        updateFields.push(`${key} = ?`);
                        updateValues.push(value);
                    }
                }
            }
            
            // Thêm ID vào cuối mảng giá trị
            updateValues.push(id);
            
            // Log SQL query để debug
            const sqlQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
            console.log('SQL Query:', sqlQuery);
            console.log('SQL Query params:', updateValues);
            
            // Thực hiện câu lệnh UPDATE
            const [result] = await this.db.execute<ResultSetHeader>(
                sqlQuery,
                updateValues
            );
            
            console.log(`Update result for booking ${id}:`, result);
            
            if (result.affectedRows === 0) {
                throw new Error(`Booking with id ${id} not found`);
            }
            
            // Lấy booking đã cập nhật
            const [rows] = await this.db.execute<BookingRow[]>(
                'SELECT * FROM bookings WHERE id = ?',
                [id]
            );
            
            console.log(`Retrieved updated booking ${id}:`, rows[0]);
            
            return rows[0];
        } catch (error) {
            console.error(`Error updating booking ${id}:`, error);
            throw error;
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

    async findAvailableRooms(startTime: Date, endTime: Date): Promise<Room[]> {
        try {
            console.log('Finding available rooms between:', {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });

            // Kiểm tra tính hợp lệ của thời gian
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                throw new Error('Thời gian không hợp lệ');
            }

            if (startTime >= endTime) {
                throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
            }

            // Format dates for MySQL
            const formattedStartTime = this.formatDateForMySQL(startTime);
            const formattedEndTime = this.formatDateForMySQL(endTime);

            console.log('Formatted dates for MySQL:', {
                formattedStartTime,
                formattedEndTime
            });

            // Lấy danh sách tất cả các phòng
            const [allRooms] = await this.db.execute<RowDataPacket[]>(
                'SELECT * FROM rooms ORDER BY name'
            );

            console.log(`Found ${allRooms.length} total rooms`);

            // Lấy danh sách các phòng đã được đặt trong khoảng thời gian
            const [bookedRooms] = await this.db.execute<RowDataPacket[]>(
                `SELECT DISTINCT room_id FROM bookings 
                 WHERE (status = 'pending' OR status = 'confirmed') 
                 AND (
                     (start_time <= ? AND end_time > ?) OR
                     (start_time < ? AND end_time >= ?) OR
                     (start_time >= ? AND end_time <= ?)
                 )`,
                [
                    formattedEndTime, formattedStartTime,
                    formattedEndTime, formattedStartTime,
                    formattedStartTime, formattedEndTime
                ]
            );

            console.log(`Found ${bookedRooms.length} booked rooms in the time range`);

            // Tạo một Set các ID phòng đã đặt
            const bookedRoomIds = new Set(bookedRooms.map(room => room.room_id));

            // Lọc ra các phòng còn trống
            const availableRooms = allRooms.filter(room => !bookedRoomIds.has(room.id));

            console.log(`Found ${availableRooms.length} available rooms`);

            return availableRooms as Room[];
        } catch (error) {
            console.error('Error finding available rooms:', error);
            throw error;
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
            if (!updatedBooking) {
                throw new Error('Failed to update booking');
            }
            return updatedBooking;
        } catch (error) {
            console.error('Error completing booking:', error);
            throw error;
        }
    }

    async createBookingGroup(groupData: Partial<BookingGroup>): Promise<BookingGroup> {
        try {
            const [result] = await this.db.execute<ResultSetHeader>(
                'INSERT INTO booking_groups (customer_id, status, created_at) VALUES (?, ?, NOW())',
                [groupData.customer_id, groupData.status || 'pending']
            );
            
            const groupId = result.insertId;
            
            const [rows] = await this.db.execute<RowDataPacket[]>(
                'SELECT * FROM booking_groups WHERE id = ?',
                [groupId]
            );
            
            return rows[0] as BookingGroup;
        } catch (error) {
            console.error('Error creating booking group:', error);
            throw error;
        }
    }

    async createMultipleBookings(
        bookingGroupId: number,
        bookingsData: Partial<Booking>[]
    ): Promise<Booking[]> {
        try {
            const createdBookings: Booking[] = [];
            
            // Tạo từng booking một và thêm vào group
            for (const bookingData of bookingsData) {
                // Thêm booking_group_id vào dữ liệu
                const bookingWithGroup = {
                    ...bookingData,
                    booking_group_id: bookingGroupId
                };
                
                // Tạo booking
                const booking = await this.createBooking(bookingWithGroup);
                createdBookings.push(booking);
            }
            
            return createdBookings;
        } catch (error) {
            console.error('Error creating multiple bookings:', error);
            throw error;
        }
    }

    async updateBookingGroupStatus(groupId: number, status: string): Promise<BookingGroup> {
        let connection: PoolConnection | null = null;
        try {
            connection = await this.db.getConnection();
            await connection.beginTransaction();

            await connection.execute(
                'UPDATE booking_groups SET status = ? WHERE id = ?',
                [status, groupId]
            );
            
            // Also update all bookings in the group
            await connection.execute(
                'UPDATE bookings SET status = ? WHERE booking_group_id = ?',
                [status, groupId]
            );
            
            // Return updated booking group
            const [rows] = await connection.execute<BookingGroupRow[]>(
                'SELECT * FROM booking_groups WHERE id = ?',
                [groupId]
            );
            
            await connection.commit();
            return rows[0];
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error updating booking group status:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async getBookingGroup(groupId: number): Promise<BookingGroup | null> {
        try {
            const [rows] = await this.db.execute<BookingGroupRow[]>(
                'SELECT * FROM booking_groups WHERE id = ?',
                [groupId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting booking group:', error);
            throw error;
        }
    }

    async getBookingsByGroup(groupId: number): Promise<Booking[]> {
        try {
            const [rows] = await this.db.execute<BookingRow[]>(
                'SELECT * FROM bookings WHERE booking_group_id = ?',
                [groupId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting bookings by group:', error);
            throw error;
        }
    }

    async completeBookingGroup(groupId: number, endTime?: Date): Promise<BookingGroup> {
        let connection: PoolConnection | null = null;
        try {
            connection = await this.db.getConnection();
            await connection.beginTransaction();

            // Update booking group status
            await connection.execute(
                'UPDATE booking_groups SET status = ? WHERE id = ?',
                ['completed', groupId]
            );
            
            // Get all bookings in the group
            const [bookings] = await connection.execute<BookingRow[]>(
                'SELECT * FROM bookings WHERE booking_group_id = ?',
                [groupId]
            );
            
            // Update each booking
            for (const booking of bookings) {
                const updateData: any = { status: 'completed' };
                
                if (endTime) {
                    updateData.end_time = this.formatDateForMySQL(endTime);
                }
                
                await connection.execute(
                    'UPDATE bookings SET status = ?, end_time = ? WHERE id = ?',
                    [
                        'completed',
                        endTime ? this.formatDateForMySQL(endTime) : booking.end_time,
                        booking.id
                    ]
                );
            }
            
            // Get updated booking group
            const [rows] = await connection.execute<BookingGroupRow[]>(
                'SELECT * FROM booking_groups WHERE id = ?',
                [groupId]
            );
            
            await connection.commit();
            return rows[0];
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error completing booking group:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

export default BookingService;

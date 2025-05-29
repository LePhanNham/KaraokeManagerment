import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Booking, BookingDetails, BookingRoom, CreateBookingDTO } from '../models/Booking';
import { Room } from '../models/Room';
import { Payment } from '../models/Payment';
import database from '../config/database';

interface BookingRow extends RowDataPacket, Booking {}
interface BookingRoomRow extends RowDataPacket, BookingRoom {}

export class BookingService {
    private get db(): Pool {
        return database.getPool();
    }

    private formatDateForMySQL(date: Date): string {
        const localDate = new Date(date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const seconds = String(localDate.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    async createBooking(bookingData: CreateBookingDTO): Promise<BookingDetails> {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Calculate time range for the booking
            const earliestStart = new Date(Math.min(...bookingData.rooms.map(r => r.start_time.getTime())));
            const latestEnd = new Date(Math.max(...bookingData.rooms.map(r => r.end_time.getTime())));

            // Insert main booking
            const [bookingResult] = await connection.execute<ResultSetHeader>(
                `INSERT INTO bookings (customer_id, start_time, end_time, status, total_amount, notes)
                 VALUES (?, ?, ?, 'pending', 0, ?)`,
                [
                    bookingData.customer_id,
                    this.formatDateForMySQL(earliestStart),
                    this.formatDateForMySQL(latestEnd),
                    bookingData.notes || ''
                ]
            );

            const bookingId = bookingResult.insertId;
            let totalAmount = bookingData.total_amount || 0;

            // Insert booking rooms
            for (const room of bookingData.rooms) {
                // Use room-specific time if available, otherwise use booking time
                const roomStartTime = room.start_time || earliestStart;
                const roomEndTime = room.end_time || latestEnd;

                await connection.execute(
                    `INSERT INTO booking_rooms
                     (booking_id, room_id, price_per_hour, start_time, end_time)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        bookingId,
                        room.room_id,
                        room.price_per_hour,
                        this.formatDateForMySQL(roomStartTime),
                        this.formatDateForMySQL(roomEndTime)
                    ]
                );

                // Tính tự động nếu không có total_amount từ frontend
                if (!bookingData.total_amount) {
                    const hours = Math.ceil(
                        (new Date(room.end_time).getTime() - new Date(room.start_time).getTime())
                        / (1000 * 60 * 60)
                    );
                    totalAmount += hours * room.price_per_hour;
                }
            }

            // Update booking total amount
            await connection.execute(
                'UPDATE bookings SET total_amount = ? WHERE id = ?',
                [totalAmount, bookingId]
            );

            await connection.commit();
            return this.getBookingDetails(bookingId);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getBookingDetails(id: number): Promise<BookingDetails> {
        const [rows] = await this.db.execute<RowDataPacket[]>(`
            SELECT
                b.*,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', br.id,
                        'room_id', r.id,
                        'room_name', r.name,
                        'room_type', r.type,
                        'price_per_hour', br.price_per_hour
                    )
                ) as rooms
            FROM bookings b
            JOIN booking_rooms br ON b.id = br.booking_id
            JOIN rooms r ON br.room_id = r.id
            WHERE b.id = ?
            GROUP BY b.id
        `, [id]);

        if (!rows[0]) throw new Error('Booking not found');
        return rows[0] as BookingDetails;
    }

    async getAllBookings(): Promise<BookingDetails[]> {
        // First get all bookings
        const [bookings] = await this.db.execute<RowDataPacket[]>(`
            SELECT b.* FROM bookings b ORDER BY b.created_at DESC
        `);

        // Then get rooms and payment status for each booking
        const bookingsWithDetails = await Promise.all(
            bookings.map(async (booking) => {
                // Get rooms for this booking
                const [rooms] = await this.db.execute<RowDataPacket[]>(`
                    SELECT
                        br.id,
                        br.room_id,
                        r.name as room_name,
                        r.type as room_type,
                        br.price_per_hour
                    FROM booking_rooms br
                    JOIN rooms r ON br.room_id = r.id
                    WHERE br.booking_id = ?
                `, [booking.id]);

                // Get payment status
                const [paymentInfo] = await this.db.execute<RowDataPacket[]>(`
                    SELECT
                        COUNT(br.id) as total_rooms,
                        COUNT(DISTINCT p.booking_room_id) as paid_rooms
                    FROM booking_rooms br
                    LEFT JOIN payments p ON p.booking_id = br.booking_id AND p.booking_room_id = br.id
                    WHERE br.booking_id = ?
                `, [booking.id]);

                const totalRooms = paymentInfo[0]?.total_rooms || 0;
                const paidRooms = paymentInfo[0]?.paid_rooms || 0;

                let payment_status = 'unpaid';
                if (paidRooms >= totalRooms && totalRooms > 0) {
                    payment_status = 'paid';
                } else if (paidRooms > 0) {
                    payment_status = 'partially_paid';
                }

                return {
                    ...booking,
                    rooms: rooms,
                    total_rooms: totalRooms,
                    paid_rooms: paidRooms,
                    payment_status
                };
            })
        );

        return bookingsWithDetails as unknown as BookingDetails[];
    }

    async getBookingById(id: number): Promise<BookingDetails | null> {
        try {
            return await this.getBookingDetails(id);
        } catch (error) {
            return null;
        }
    }

    async updateBooking(id: number, updateData: Partial<Booking>): Promise<BookingDetails> {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Build update query dynamically
            const updateFields = [];
            const updateValues = [];

            if (updateData.status) {
                updateFields.push('status = ?');
                updateValues.push(updateData.status);
            }
            if (updateData.notes !== undefined) {
                updateFields.push('notes = ?');
                updateValues.push(updateData.notes);
            }
            if (updateData.total_amount !== undefined) {
                updateFields.push('total_amount = ?');
                updateValues.push(updateData.total_amount);
            }

            if (updateFields.length > 0) {
                updateValues.push(id);
                await connection.execute(
                    `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }

            await connection.commit();
            return await this.getBookingDetails(id);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deleteBooking(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Delete booking rooms first (foreign key constraint)
            await connection.execute('DELETE FROM booking_rooms WHERE booking_id = ?', [id]);

            // Delete payments
            await connection.execute('DELETE FROM payments WHERE booking_id = ?', [id]);

            // Delete booking
            await connection.execute('DELETE FROM bookings WHERE id = ?', [id]);

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async extendBooking(id: number, newEndTime: Date): Promise<BookingDetails> {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Update booking end time
            await connection.execute(
                'UPDATE bookings SET end_time = ? WHERE id = ?',
                [this.formatDateForMySQL(newEndTime), id]
            );

            await connection.commit();
            return await this.getBookingDetails(id);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async findAvailableRooms(startTime: Date, endTime: Date): Promise<Room[]> {
        const [rows] = await this.db.execute<RowDataPacket[]>(`
            SELECT r.*
            FROM rooms r
            WHERE r.id NOT IN (
                SELECT br.room_id
                FROM booking_rooms br
                JOIN bookings b ON br.booking_id = b.id
                WHERE b.status NOT IN ('cancelled', 'completed')
                AND (
                    (b.start_time <= ? AND b.end_time > ?) OR
                    (b.start_time < ? AND b.end_time >= ?) OR
                    (b.start_time >= ? AND b.end_time <= ?)
                )
            )
        `, [
            this.formatDateForMySQL(endTime),
            this.formatDateForMySQL(startTime),
            this.formatDateForMySQL(endTime),
            this.formatDateForMySQL(startTime),
            this.formatDateForMySQL(startTime),
            this.formatDateForMySQL(endTime)
        ]);

        return rows as Room[];
    }

    async completeBookingWithPayment(params: {
        bookingId: number;
        endTime: Date;
        totalAmount?: number;
        paymentMethod: string;
        notes?: string;
    }) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Update booking status and checkout time
            await connection.execute(
                `UPDATE bookings b
                 JOIN booking_rooms br ON b.id = br.booking_id
                 SET b.status = 'completed',
                     br.check_out_time = ?
                 WHERE b.id = ?`,
                [this.formatDateForMySQL(params.endTime), params.bookingId]
            );

            // Create payment record if amount is provided
            if (params.totalAmount) {
                await connection.execute(
                    `INSERT INTO payments (booking_id, amount, payment_method, notes)
                     VALUES (?, ?, ?, ?)`,
                    [params.bookingId, params.totalAmount, params.paymentMethod, params.notes]
                );
            }

            await connection.commit();
            return this.getBookingDetails(params.bookingId);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default BookingService;

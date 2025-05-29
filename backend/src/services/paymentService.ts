import { Pool, RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import database from '../config/database';

interface Payment {
    id?: number;
    booking_id?: number;
    booking_group_id?: number;
    amount: number;
    payment_method: string;
    payment_date: Date;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

interface PaymentRow extends RowDataPacket, Payment {}

export default class PaymentService {
    private get db(): Pool {
        return database.getPool();
    }

    async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
        try {
            console.log('Creating payment with data:', paymentData);

            // Format date for MySQL
            const paymentDate = this.formatDateForMySQL(paymentData.payment_date || new Date());

            // Thêm log để kiểm tra SQL query
            console.log('SQL Query params:', [
                paymentData.booking_id,
                paymentData.amount,
                paymentData.payment_method,
                paymentDate,
                paymentData.notes || ''
            ]);

            const [result] = await this.db.execute<ResultSetHeader>(
                `INSERT INTO payments
                (booking_id, amount, payment_method, payment_date, notes)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    paymentData.booking_id,
                    paymentData.amount,
                    paymentData.payment_method,
                    paymentDate,
                    paymentData.notes || ''
                ]
            );

            console.log('Payment created with ID:', result.insertId);

            // Kiểm tra xem payment có được tạo thành công không
            const [rows] = await this.db.execute<PaymentRow[]>(
                'SELECT * FROM payments WHERE id = ?',
                [result.insertId]
            );

            console.log('Retrieved payment:', rows[0]);

            return rows[0];
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    async createGroupPayment(paymentData: Partial<Payment>): Promise<Payment> {
        try {
            // Format date for MySQL
            const paymentDate = this.formatDateForMySQL(paymentData.payment_date || new Date());

            const [result] = await this.db.execute<ResultSetHeader>(
                `INSERT INTO payments
                (booking_group_id, amount, payment_method, payment_date, notes)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    paymentData.booking_group_id,
                    paymentData.amount,
                    paymentData.payment_method,
                    paymentDate,
                    paymentData.notes || ''
                ]
            );

            const [rows] = await this.db.execute<PaymentRow[]>(
                'SELECT * FROM payments WHERE id = ?',
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            console.error('Error creating group payment:', error);
            throw error;
        }
    }

    // Get all unpaid bookings (confirmed but not paid)
    async getUnpaidBookings() {
        try {
            const query = `
                SELECT
                    b.id,
                    b.customer_id,
                    c.name as customer_name,
                    b.start_time,
                    b.end_time,
                    b.total_amount,
                    b.status,
                    b.notes,
                    b.created_at
                FROM bookings b
                LEFT JOIN customers c ON b.customer_id = c.id
                WHERE b.status = 'confirmed'
                ORDER BY b.created_at DESC
            `;

            const [rows] = await this.db.execute<RowDataPacket[]>(query);

            console.log(`=== UNPAID BOOKINGS QUERY ===`);
            console.log(`Found ${rows.length} pending bookings:`, rows.map(b => ({ id: b.id, status: b.status })));

            // Get rooms for each booking
            const bookingsWithRooms = await Promise.all(
                rows.map(async (booking) => {
                    const roomQuery = `
                        SELECT
                            br.id,
                            br.room_id,
                            r.name as room_name,
                            r.type as room_type,
                            br.price_per_hour,
                            TIMESTAMPDIFF(HOUR, ?, ?) as hours,
                            (TIMESTAMPDIFF(HOUR, ?, ?) * br.price_per_hour) as subtotal
                        FROM booking_rooms br
                        LEFT JOIN rooms r ON br.room_id = r.id
                        WHERE br.booking_id = ?
                        AND NOT EXISTS (
                            SELECT 1 FROM payments p
                            WHERE p.booking_room_id = br.id
                        )
                    `;

                    const [roomRows] = await this.db.execute<RowDataPacket[]>(roomQuery, [
                        booking.start_time, booking.end_time,
                        booking.start_time, booking.end_time,
                        booking.id
                    ]);

                    // Ensure numeric values are properly converted
                    const processedRooms = roomRows.map(room => ({
                        ...room,
                        price_per_hour: Number(room.price_per_hour),
                        hours: Number(room.hours),
                        subtotal: Number(room.subtotal)
                    }));

                    const calculatedTotal = processedRooms.reduce((sum, room) => sum + room.subtotal, 0);

                    // Use calculated total instead of DB total_amount to ensure accuracy
                    return {
                        ...booking,
                        total_amount: calculatedTotal, // Use real-time calculation
                        rooms: processedRooms
                    };
                })
            );

            // Filter out bookings that have no unpaid rooms
            const bookingsWithUnpaidRooms = bookingsWithRooms.filter(booking => booking.rooms.length > 0);

            console.log(`=== FILTERED RESULTS ===`);
            console.log(`Bookings with unpaid rooms: ${bookingsWithUnpaidRooms.length}`);

            return bookingsWithUnpaidRooms;
        } catch (error) {
            console.error('Error getting unpaid bookings:', error);
            throw new Error('Lỗi khi lấy danh sách booking chưa thanh toán');
        }
    }

    // Process payment with transaction
    async processPayment(paymentData: any) {
        const connection = await this.db.getConnection();

        try {
            await connection.beginTransaction();

            // Map payment method to match database enum
            const paymentMethod = paymentData.payment_method === 'bank_transfer' ? 'transfer' : paymentData.payment_method;

            // Insert payment record (match actual database schema)
            const insertPaymentQuery = `
                INSERT INTO payments (
                    booking_id,
                    booking_room_id,
                    amount,
                    payment_method,
                    payment_date,
                    notes
                ) VALUES (?, ?, ?, ?, NOW(), ?)
            `;

            const [paymentResult] = await connection.execute<ResultSetHeader>(
                insertPaymentQuery,
                [
                    paymentData.booking_id || null,
                    paymentData.booking_room_id || null,
                    paymentData.amount,
                    paymentMethod,
                    paymentData.notes || null
                ]
            );

            // Check if all rooms in booking have been paid
            if (paymentData.booking_id) {
                await this.updateBookingStatusIfFullyPaid(connection, paymentData.booking_id);
            }

            await connection.commit();

            return {
                success: true,
                message: 'Thanh toán thành công!',
                payment_id: paymentResult.insertId,
                amount: paymentData.amount,
                payment_method: paymentData.payment_method
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error processing payment:', error);
            throw new Error('Lỗi khi xử lý thanh toán');
        } finally {
            connection.release();
        }
    }

    // Process multiple payments in one transaction
    async processMultiplePayment(paymentItems: any[], paymentMethod: string, notes?: string) {
        const connection = await this.db.getConnection();

        try {
            await connection.beginTransaction();

            console.log('=== PROCESSING MULTIPLE PAYMENT ===');
            console.log(`Processing ${paymentItems.length} payment items`);
            console.log('Payment items:', paymentItems);

            // Map payment method to match database enum
            const mappedPaymentMethod = paymentMethod === 'bank_transfer' ? 'transfer' : paymentMethod;

            const paymentResults = [];
            const affectedBookings = new Set<number>();

            // Insert payment record for each item
            const insertPaymentQuery = `
                INSERT INTO payments (
                    booking_id,
                    booking_room_id,
                    amount,
                    payment_method,
                    payment_date,
                    notes
                ) VALUES (?, ?, ?, ?, NOW(), ?)
            `;

            for (const item of paymentItems) {
                const [paymentResult] = await connection.execute<ResultSetHeader>(
                    insertPaymentQuery,
                    [
                        item.booking_id || null,
                        item.booking_room_id || null,
                        item.amount,
                        mappedPaymentMethod,
                        notes || `Thanh toán nhiều items - ${item.description || ''}`
                    ]
                );

                paymentResults.push({
                    payment_id: paymentResult.insertId,
                    booking_id: item.booking_id,
                    booking_room_id: item.booking_room_id,
                    amount: item.amount
                });

                // Track affected bookings for status update
                if (item.booking_id) {
                    affectedBookings.add(item.booking_id);
                }

                console.log(`✅ Payment created for booking ${item.booking_id}, room ${item.booking_room_id}, amount: ${item.amount}`);
            }

            // Update booking status for all affected bookings
            for (const bookingId of affectedBookings) {
                await this.updateBookingStatusIfFullyPaid(connection, bookingId);
            }

            await connection.commit();

            const totalAmount = paymentItems.reduce((sum, item) => sum + item.amount, 0);

            return {
                success: true,
                message: `Thanh toán thành công ${paymentItems.length} items!`,
                payment_results: paymentResults,
                total_amount: totalAmount,
                payment_method: paymentMethod,
                items_count: paymentItems.length
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error processing multiple payment:', error);
            throw new Error('Lỗi khi xử lý thanh toán nhiều items');
        } finally {
            connection.release();
        }
    }

    // Helper method to update booking status if fully paid
    private async updateBookingStatusIfFullyPaid(connection: PoolConnection, bookingId: number) {
        // Get total rooms in booking
        const [totalRoomsResult] = await connection.execute<RowDataPacket[]>(
            'SELECT COUNT(*) as total FROM booking_rooms WHERE booking_id = ?',
            [bookingId]
        );

        // Get paid rooms count (rooms that have payment records with booking_room_id)
        const [paidRoomsResult] = await connection.execute<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT p.booking_room_id) as paid
             FROM payments p
             WHERE p.booking_id = ? AND p.booking_room_id IS NOT NULL`,
            [bookingId]
        );

        const totalRooms = totalRoomsResult[0].total;
        const paidRooms = paidRoomsResult[0].paid;

        console.log(`=== PAYMENT TRACKING DEBUG ===`);
        console.log(`Booking #${bookingId}: ${paidRooms}/${totalRooms} rooms paid`);

        // Only mark booking as completed if ALL rooms have been paid
        if (paidRooms >= totalRooms) {
            const updateBookingQuery = `
                UPDATE bookings
                SET status = 'completed', updated_at = NOW()
                WHERE id = ?
            `;

            await connection.execute(updateBookingQuery, [bookingId]);
            console.log(`✅ Booking #${bookingId} marked as completed - ALL rooms paid`);
        } else {
            console.log(`⏳ Booking #${bookingId} still pending - ${totalRooms - paidRooms} rooms remaining`);
        }
    }

    // Get payment history
    async getPaymentHistory(customerId?: number, page: number = 1, limit: number = 10) {
        try {
            const offset = (page - 1) * limit;

            let query = `
                SELECT
                    p.id,
                    p.booking_id,
                    p.booking_group_id,
                    p.amount,
                    p.payment_method,
                    p.payment_date,
                    p.status,
                    p.receipt_number,
                    p.notes,
                    p.created_at,
                    c.name as customer_name
                FROM payments p
                LEFT JOIN bookings b ON p.booking_id = b.id
                LEFT JOIN customers c ON b.customer_id = c.id
            `;

            const params: any[] = [];

            if (customerId) {
                query += ` WHERE b.customer_id = ?`;
                params.push(customerId);
            }

            query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [rows] = await this.db.execute<RowDataPacket[]>(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(*) as total
                FROM payments p
                LEFT JOIN bookings b ON p.booking_id = b.id
            `;

            if (customerId) {
                countQuery += ` WHERE b.customer_id = ?`;
            }

            const [countRows] = await this.db.execute<RowDataPacket[]>(
                countQuery,
                customerId ? [customerId] : []
            );

            return {
                payments: rows,
                total: countRows[0].total,
                page,
                limit,
                totalPages: Math.ceil(countRows[0].total / limit)
            };

        } catch (error) {
            console.error('Error getting payment history:', error);
            throw new Error('Lỗi khi lấy lịch sử thanh toán');
        }
    }

    // Get payment details
    async getPaymentDetails(paymentId: number) {
        try {
            const query = `
                SELECT
                    p.*,
                    b.start_time,
                    b.end_time,
                    c.name as customer_name,
                    c.phone_number as customer_phone,
                    c.email as customer_email
                FROM payments p
                LEFT JOIN bookings b ON p.booking_id = b.id
                LEFT JOIN customers c ON b.customer_id = c.id
                WHERE p.id = ?
            `;

            const [rows] = await this.db.execute<RowDataPacket[]>(query, [paymentId]);

            if (rows.length === 0) {
                throw new Error('Không tìm thấy thông tin thanh toán');
            }

            return rows[0];
        } catch (error) {
            console.error('Error getting payment details:', error);
            throw new Error('Lỗi khi lấy chi tiết thanh toán');
        }
    }

    // Validate payment data
    validatePaymentData(paymentData: any): string | null {
        if (!paymentData.booking_id) {
            return 'Thiếu thông tin booking';
        }

        if (!paymentData.amount || paymentData.amount <= 0) {
            return 'Số tiền thanh toán phải lớn hơn 0';
        }

        if (!paymentData.payment_method) {
            return 'Vui lòng chọn phương thức thanh toán';
        }

        const validMethods = ['cash', 'card', 'bank_transfer'];
        if (!validMethods.includes(paymentData.payment_method)) {
            return 'Phương thức thanh toán không hợp lệ';
        }

        return null;
    }

    // Check specific booking_room record (debug utility)
    async checkBookingRoom(id: number) {
        try {
            const [rows] = await this.db.execute<RowDataPacket[]>(`
                SELECT
                    br.*,
                    b.start_time as booking_start,
                    b.end_time as booking_end,
                    r.name as room_name
                FROM booking_rooms br
                JOIN bookings b ON br.booking_id = b.id
                JOIN rooms r ON br.room_id = r.id
                WHERE br.id = ?
            `, [id]);

            return {
                success: true,
                data: rows[0] || null,
                message: rows[0] ? 'Record found' : 'Record not found'
            };
        } catch (error) {
            console.error('Error checking booking room:', error);
            throw new Error('Lỗi khi kiểm tra booking room');
        }
    }

    // Drop status column from rooms table (one-time utility)
    async dropRoomStatusColumn() {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Check if status column exists
            const [columns] = await connection.execute<RowDataPacket[]>(`
                SHOW COLUMNS FROM rooms LIKE 'status'
            `);

            if (columns.length === 0) {
                return {
                    success: true,
                    message: 'Cột status không tồn tại trong bảng rooms',
                    already_dropped: true
                };
            }

            // Drop the status column
            await connection.execute(`
                ALTER TABLE rooms DROP COLUMN status
            `);

            await connection.commit();

            return {
                success: true,
                message: 'Đã xóa cột status khỏi bảng rooms thành công',
                dropped: true
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error dropping status column:', error);
            throw new Error('Lỗi khi xóa cột status');
        } finally {
            connection.release();
        }
    }

    // Fix NULL times in booking_rooms (temporary utility)
    async fixNullTimes() {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();

            // Fix NULL start_time and end_time in booking_rooms
            const [updateResult] = await connection.execute<ResultSetHeader>(`
                UPDATE booking_rooms br
                JOIN bookings b ON br.booking_id = b.id
                SET
                    br.start_time = b.start_time,
                    br.end_time = b.end_time
                WHERE
                    br.start_time IS NULL
                    OR br.end_time IS NULL
            `);

            // Get count of fixed records
            const [countResult] = await connection.execute<RowDataPacket[]>(`
                SELECT
                    COUNT(*) as total_rooms,
                    SUM(CASE WHEN br.start_time IS NOT NULL AND br.end_time IS NOT NULL THEN 1 ELSE 0 END) as fixed_rooms
                FROM booking_rooms br
            `);

            await connection.commit();

            return {
                success: true,
                message: 'Đã sửa thời gian NULL trong booking_rooms',
                affected_rows: updateResult.affectedRows,
                total_rooms: countResult[0].total_rooms,
                fixed_rooms: countResult[0].fixed_rooms
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error fixing NULL times:', error);
            throw new Error('Lỗi khi sửa thời gian NULL');
        } finally {
            connection.release();
        }
    }

    // Helper method to format date for MySQL
    private formatDateForMySQL(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}






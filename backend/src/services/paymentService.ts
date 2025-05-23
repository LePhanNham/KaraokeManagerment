import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
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
    private db: Pool;

    constructor() {
        // Đảm bảo lấy pool connection đúng cách
        this.db = database.getPool();
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






import { Pool, RowDataPacket } from 'mysql2/promise';
import database from '../config/database';

interface RevenueData {
    period: number;
    total_revenue: number;
    bookings_count: number;
    avg_revenue: number;
}

class ReportService {
    private db: Pool;

    constructor() {
        this.db = database.getPool();
    }

    async getRevenueByMonth(year: number): Promise<RevenueData[]> {
        try {
            console.log(`Getting revenue data for year: ${year}`);
            
            const query = `
                SELECT 
                    MONTH(start_time) as period,
                    SUM(total_amount) as total_revenue,
                    COUNT(*) as bookings_count,
                    AVG(total_amount) as avg_revenue
                FROM bookings
                WHERE 
                    YEAR(start_time) = ? 
                    AND status IN ('completed', 'confirmed')
                    AND EXISTS (SELECT 1 FROM payments WHERE payments.booking_id = bookings.id)
                GROUP BY MONTH(start_time)
                ORDER BY MONTH(start_time)
            `;

            console.log('Executing query:', query);
            const [rows] = await this.db.execute<RowDataPacket[]>(query, [year]);
            console.log('Query result:', rows);
            
            return rows.map(row => ({
                period: Number(row.period),
                total_revenue: Number(row.total_revenue),
                bookings_count: Number(row.bookings_count),
                avg_revenue: Number(row.avg_revenue)
            }));
        } catch (error) {
            console.error('Error getting revenue by month:', error);
            throw error;
        }
    }

    async getRevenueByQuarter(year: number): Promise<RevenueData[]> {
        try {
            console.log(`Getting quarterly revenue data for year: ${year}`);
            
            const query = `
                SELECT 
                    QUARTER(start_time) as period,
                    SUM(total_amount) as total_revenue,
                    COUNT(*) as bookings_count,
                    AVG(total_amount) as avg_revenue
                FROM bookings
                WHERE 
                    YEAR(start_time) = ? 
                    AND status IN ('completed', 'confirmed')
                    AND EXISTS (SELECT 1 FROM payments WHERE payments.booking_id = bookings.id)
                GROUP BY QUARTER(start_time)
                ORDER BY QUARTER(start_time)
            `;

            console.log('Executing query:', query);
            const [rows] = await this.db.execute<RowDataPacket[]>(query, [year]);
            console.log('Query result:', rows);
            
            return rows.map(row => ({
                period: Number(row.period),
                total_revenue: Number(row.total_revenue),
                bookings_count: Number(row.bookings_count),
                avg_revenue: Number(row.avg_revenue)
            }));
        } catch (error) {
            console.error('Error getting revenue by quarter:', error);
            throw error;
        }
    }

    async getRevenueByYear(startYear: number, endYear: number): Promise<RevenueData[]> {
        try {
            console.log(`Getting yearly revenue data from ${startYear} to ${endYear}`);
            
            const query = `
                SELECT 
                    YEAR(start_time) as period,
                    SUM(total_amount) as total_revenue,
                    COUNT(*) as bookings_count,
                    AVG(total_amount) as avg_revenue
                FROM bookings
                WHERE 
                    YEAR(start_time) BETWEEN ? AND ?
                    AND status IN ('completed', 'confirmed')
                    AND EXISTS (SELECT 1 FROM payments WHERE payments.booking_id = bookings.id)
                GROUP BY YEAR(start_time)
                ORDER BY YEAR(start_time)
            `;

            console.log('Executing query:', query);
            const [rows] = await this.db.execute<RowDataPacket[]>(query, [startYear, endYear]);
            console.log('Query result:', rows);
            
            return rows.map(row => ({
                period: Number(row.period),
                total_revenue: Number(row.total_revenue),
                bookings_count: Number(row.bookings_count),
                avg_revenue: Number(row.avg_revenue)
            }));
        } catch (error) {
            console.error('Error getting revenue by year:', error);
            throw error;
        }
    }

    async getTopRooms(year: number, limit: number = 5): Promise<any[]> {
        try {
            console.log(`Getting top ${limit} rooms for year: ${year}`);
            
            // Convert limit to a number to ensure it's the right type
            const limitValue = Number(limit);
            
            // Construct query with hardcoded LIMIT
            const query = `
                SELECT 
                    r.id,
                    r.name,
                    r.type,
                    COUNT(b.id) as booking_count,
                    SUM(IFNULL(b.total_amount, 0)) as total_revenue
                FROM rooms r
                LEFT JOIN bookings b ON b.room_id = r.id AND YEAR(b.start_time) = ? 
                    AND b.status IN ('completed', 'confirmed')
                    AND EXISTS (SELECT 1 FROM payments WHERE payments.booking_id = b.id)
                GROUP BY r.id
                ORDER BY total_revenue DESC
                LIMIT ${limitValue}
            `;

            console.log('Executing query:', query);
            console.log('Query parameters:', [year]);
            
            // Use execute with only the year parameter
            const [rows] = await this.db.execute<RowDataPacket[]>(query, [year]);
            console.log('Query result:', rows);
            
            return rows as any[];
        } catch (error) {
            console.error('Error getting top rooms:', error);
            console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
            
            // Return empty array instead of throwing error
            return [];
        }
    }
}

export default ReportService;

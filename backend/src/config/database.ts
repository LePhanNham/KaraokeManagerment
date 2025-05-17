import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
    private static pool: Pool;

    static async initialize(): Promise<void> {
        if (this.pool) {
            return; // Already initialized
        }

        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '19032003',
                database: process.env.DB_NAME || 'karaoke_management',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            // Verify connection
            const connection = await this.pool.getConnection();
            connection.release();
            console.log('Database connection established successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    static getPool(): Pool {
        if (!this.pool) {
            throw new Error('Database connection pool not initialized. Call initialize() first.');
        }
        return this.pool;
    }
}

export default Database;
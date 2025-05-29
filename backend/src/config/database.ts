import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
    private static pool: Pool;
    private static isInitializing: boolean = false;
    private static initPromise: Promise<void> | null = null;

    static async initialize(): Promise<void> {
        if (this.pool) {
            return; // Already initialized
        }

        if (this.isInitializing) {
            // If already initializing, wait for it to complete
            if (this.initPromise) {
                return this.initPromise;
            }
        }

        this.isInitializing = true;
        this.initPromise = this._initialize();
        return this.initPromise;
    }

    private static async _initialize(): Promise<void> {
        try {
            console.log('Initializing database connection pool...');
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '19032003',
                database: process.env.DB_NAME || 'karaoke_managements',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            // Verify connection
            const connection = await this.pool.getConnection();
            connection.release();
            console.log('Database connection established successfully');
            this.isInitializing = false;
        } catch (error) {
            this.isInitializing = false;
            this.pool = undefined as any; // Reset pool if initialization failed
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    static isInitialized(): boolean {
        return !!this.pool;
    }

    static getPool(): Pool {
        if (!this.pool) {
            console.error('Database pool not initialized. Attempting to initialize now...');
            // Throw error but also try to initialize for next time
            this.initialize().catch(err => console.error('Failed to initialize database on demand:', err));
            throw new Error('Database connection pool not initialized. Call initialize() first.');
        }
        return this.pool;
    }
}

export default Database;

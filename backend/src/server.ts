import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import Database from './config/database';

// Import routes
import customerRoutes from './routes/customerRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
import bookingRoomRoutes from './routes/bookingRoomRoutes';
// import bookingGroupRoutes from './routes/bookingGroupRoutes'; // Removed - using standard booking model
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Karaoke Management API',
        status: 'Running',
        version: '1.0.0',
        documentation: '/api/docs',
        availableRoutes: [
            '/api/customers',
            '/api/rooms',
            '/api/bookings',
            '/api/payments',
            '/api/reports'
        ]
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'TypeScript backend API server is running!' });
});

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/booking-rooms', bookingRoomRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await Database.initialize();
        console.log('✅ Database initialized successfully');

        // Test database connection
        const pool = Database.getPool();
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('✅ Database connection verified');

        app.listen(PORT, () => {
            console.log(`🚀 TypeScript Backend server running on http://localhost:${PORT}`);
            console.log('📋 Available routes:');
            console.log('  GET  /api/test');
            console.log('  POST /api/customers/login');
            console.log('  GET  /api/rooms');
            console.log('  POST /api/bookings/find-available-rooms');
            console.log('  POST /api/bookings');
            console.log('  GET  /api/reports/dashboard');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal. Shutting down gracefully...');
    try {
        const pool = Database.getPool();
        await pool.end();
        console.log('Database connections closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

startServer();

export default app;

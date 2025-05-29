import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import Database from './config/database';

// Import routes
import customerRoutes from './routes/customerRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
// import bookingGroupRoutes from './routes/bookingGroupRoutes'; // Removed - using standard booking model
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'TypeScript backend API server is running!' });
});

// Register routes
app.use('/api/customers', customerRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
// app.use('/api/booking-groups', bookingGroupRoutes); // Removed - using standard booking model
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
async function startServer() {
    try {
        // Initialize database
        await Database.initialize();
        console.log('✅ Database initialized successfully');

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

startServer();

export default app;

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import Database from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Thêm route test để kiểm tra server có hoạt động không
app.get('/api/test', (req, res) => {
    res.json({ message: 'API server is running!' });
});

// Khởi tạo database và khởi động server
async function startServer() {
    try {
        // Khởi tạo database trước
        await Database.initialize();
        console.log('Database initialized successfully');

        // Khởi động server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            
            // Chỉ đăng ký routes sau khi server đã khởi động và database đã kết nối
            setupRoutes();
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Hàm đăng ký routes
function setupRoutes() {
    try {
        // Import routes
        const bookingRoutes = require('./routes/bookingRoutes').default;
        const customerRoutes = require('./routes/customerRoutes').default;
        const roomRoutes = require('./routes/roomRoutes').default;
        const reportRoutes = require('./routes/reportRoutes').default;

        // Đăng ký routes
        app.use('/api/bookings', bookingRoutes);
        app.use('/api/customers', customerRoutes);
        app.use('/api/rooms', roomRoutes);
        app.use('/api/reports', reportRoutes);

        // Error handling middleware
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        });

        console.log('All routes registered successfully');
    } catch (error) {
        console.error('Error setting up routes:', error);
    }
}

// Khởi động server
startServer();

export default app;

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bookingRoutes from './routes/bookingRoutes';
// Import các routes khác

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Đăng ký routes
app.use('/api/bookings', bookingRoutes);
// Đăng ký các routes khác

// Xử lý lỗi 404
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;

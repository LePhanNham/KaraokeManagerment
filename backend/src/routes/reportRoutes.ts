import express from 'express';
import ReportController from '../controllers/reportController';

const router = express.Router();

// Thêm route test không cần auth để kiểm tra
router.get('/test', (req, res) => {
  res.json({ message: 'Report routes are working!' });
});

// Tạo một factory function để khởi tạo controller khi cần
const getController = () => {
  const controller = new ReportController();
  return controller;
};

// Sử dụng factory function trong route handlers
router.get('/revenue/monthly', (req, res) => {
  getController().getRevenueByMonth(req, res);
});

router.get('/revenue/quarterly', (req, res) => {
  getController().getRevenueByQuarter(req, res);
});

router.get('/revenue/yearly', (req, res) => {
  getController().getRevenueByYear(req, res);
});

router.get('/rooms/top', (req, res) => {
  getController().getTopRooms(req, res);
});

export default router;

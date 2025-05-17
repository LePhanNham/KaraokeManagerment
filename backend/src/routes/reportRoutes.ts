import express from 'express';
import ReportController from '../controllers/reportController';

const router = express.Router();
const reportController = new ReportController();

router.get('/test', (req, res) => {
  res.json({ message: 'Report routes are working!' });
});


// Thống kê doanh thu theo tháng
router.get('/revenue/monthly', reportController.getRevenueByMonth.bind(reportController));

// Thống kê doanh thu theo quý
router.get('/revenue/quarterly', reportController.getRevenueByQuarter.bind(reportController));

// Thống kê doanh thu theo năm
router.get('/revenue/yearly', reportController.getRevenueByYear.bind(reportController));

// Thống kê top phòng được sử dụng nhiều nhất
router.get('/rooms/top', reportController.getTopRooms.bind(reportController));

export default router;
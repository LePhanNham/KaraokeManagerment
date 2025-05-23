import { Router } from 'express';
import RoomController from '../controllers/roomController';
import { auth } from '../middlewares/authMiddleware';

const router = Router();

// Không khởi tạo controller ở đây
// const roomController = new RoomController();

// Thêm route test không cần auth để kiểm tra
router.get('/test', (req, res) => {
  res.json({ message: 'Room routes are working!' });
});

// Tạo một factory function để khởi tạo controller khi cần
const getController = () => {
  const controller = new RoomController();
  return controller;
};

// Sử dụng factory function trong route handlers
router.get('/', (req, res) => {
  getController().getAllRooms(req, res);
});

router.get('/:id', (req, res) => {
  getController().getRoom(req, res);
});

router.post('/', (req, res) => {
  getController().createRoom(req, res);
});

router.put('/:id', (req, res) => {
  getController().updateRoom(req, res);
});

router.delete('/:id', (req, res) => {
  getController().deleteRoom(req, res);
});

export default router;

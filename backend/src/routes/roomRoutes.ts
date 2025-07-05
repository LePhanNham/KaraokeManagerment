import express from 'express';
import RoomController from '../controllers/roomController';

const router = express.Router();
const roomController = new RoomController();

// Room routes
router.get('/', roomController.getRooms.bind(roomController));
router.get('/:id', roomController.getRoom.bind(roomController));
router.post('/', roomController.createRoom.bind(roomController));
router.put('/:id', roomController.updateRoom.bind(roomController));
router.delete('/:id', roomController.deleteRoom.bind(roomController));

export default router;

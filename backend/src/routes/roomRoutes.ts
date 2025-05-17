import { Router } from 'express';
import RoomController from '../controllers/roomController';
import { auth } from '../middlewares/authMiddleware';

const router = Router();
const roomController = new RoomController();

router.get('/', roomController.getAllRooms.bind(roomController));
router.get('/:id', roomController.getRoom.bind(roomController));

router.post('/', roomController.createRoom.bind(roomController));
router.put('/:id', roomController.updateRoom.bind(roomController));
router.delete('/:id', roomController.deleteRoom.bind(roomController));

export default router;
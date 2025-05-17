import { Request, Response } from 'express';
import RoomService from '../services/roomService';
import { Room } from '../models/Room';

class RoomController {
    private roomService: RoomService;

    constructor() {
        this.roomService = new RoomService();
    }

    async createRoom(req: Request, res: Response) {
        try {
            console.log('Received create room request:', req.body);

            const { name, type, price_per_hour, capacity } = req.body;

            if (!name || !price_per_hour || !capacity) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, price_per_hour, and capacity are required'
                });
            }

            let roomType = type as string;
            if (roomType === 'Normal') {
                roomType = 'Standard';
                console.log('Converting room type from Normal to Standard in controller');
            }

            const roomData: Partial<Room> = {
                name: name.trim(),
                type: type,
                price_per_hour: Number(price_per_hour),
                capacity: Number(capacity),
            };

            const room = await this.roomService.createRoom(roomData);

            return res.status(201).json({
                success: true,
                data: room,
                message: 'Room created successfully'
            });

        } catch (error) {
            console.error('Controller error creating room:', error);
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            
            if (message.includes('Missing required fields')) {
                return res.status(400).json({
                    success: false,
                    message
                });
            }
            
            if (message.includes('Room name already exists')) {
                return res.status(409).json({
                    success: false,
                    message
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error creating room',
                error: message
            });
        }
    }

    async getRoom(req: Request, res: Response) {
        try {
            const roomId = parseInt(req.params.id);
            const room = await this.roomService.getRoomById(roomId);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json({
                success: true,
                data: room
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({
                success: false,
                message: 'Error retrieving room',
                error: message
            });
        }
    }

    async getAllRooms(req: Request, res: Response) {
        try {
            const rooms = await this.roomService.getAllRooms();
            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({
                success: false,
                message: 'Error retrieving rooms',
                error: message
            });
        }
    }

    async updateRoom(req: Request, res: Response) {
        try {
            const roomId = parseInt(req.params.id);
            const room = await this.roomService.updateRoom(roomId, req.body);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json({
                success: true,
                data: room,
                message: 'Room updated successfully'
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            
            if (message.includes('Room name already exists')) {
                return res.status(409).json({
                    success: false,
                    message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error updating room',
                error: message
            });
        }
    }

    async deleteRoom(req: Request, res: Response) {
        try {
            const roomId = parseInt(req.params.id);
            const success = await this.roomService.deleteRoom(roomId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Phòng không tồn tại hoặc đã bị xóa'
                });
            }

            res.json({
                success: true,
                message: 'Xóa phòng thành công'
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            
            if (message.includes('has existing bookings')) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa phòng vì có đơn đặt phòng liên quan'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa phòng',
                error: message
            });
        }
    }
}

export default RoomController;
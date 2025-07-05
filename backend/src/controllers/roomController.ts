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

            if (!name || !type || !price_per_hour || !capacity) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, type, price_per_hour, and capacity are required'
                });
            }

            // Validate price and capacity
            const priceNumber = Number(price_per_hour);
            const capacityNumber = Number(capacity);

            if (isNaN(priceNumber) || priceNumber <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price per hour must be a positive number'
                });
            }

            if (isNaN(capacityNumber) || capacityNumber <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Capacity must be a positive number'
                });
            }

            const room: Omit<Room, 'id'> = {
                name,
                type,
                price_per_hour: priceNumber,
                capacity: capacityNumber
            };

            const newRoom = await this.roomService.createRoom(room);
            res.status(201).json(newRoom);
        } catch (error: any) {
            console.error('Error creating room:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async getRooms(req: Request, res: Response) {
        try {
            const rooms = await this.roomService.getRooms();
            res.json(rooms);
        } catch (error: any) {
            console.error('Error getting rooms:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async getRoom(req: Request, res: Response) {
        try {
            const roomId = parseInt(req.params.id);
            if (isNaN(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID'
                });
            }

            const room = await this.roomService.getRoomById(roomId);
            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json(room);
        } catch (error: any) {
            console.error('Error getting room:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async updateRoom(req: Request, res: Response) {
        try {
            const roomId = parseInt(req.params.id);
            if (isNaN(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID'
                });
            }

            const updates = req.body;
            if (updates.price_per_hour) {
                const priceNumber = Number(updates.price_per_hour);
                if (isNaN(priceNumber) || priceNumber <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Price per hour must be a positive number'
                    });
                }
                updates.price_per_hour = priceNumber;
            }

            if (updates.capacity) {
                const capacityNumber = Number(updates.capacity);
                if (isNaN(capacityNumber) || capacityNumber <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Capacity must be a positive number'
                    });
                }
                updates.capacity = capacityNumber;
            }

            const updatedRoom = await this.roomService.updateRoom(roomId, updates);
            if (!updatedRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json(updatedRoom);
        } catch (error: any) {
            console.error('Error updating room:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async deleteRoom(req: Request, res: Response) {
        try {
            const roomId = parseInt(req.params.id);
            if (isNaN(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID'
                });
            }

            await this.roomService.deleteRoom(roomId);
            res.status(204).send();
        } catch (error: any) {
            console.error('Error deleting room:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}

export default RoomController;
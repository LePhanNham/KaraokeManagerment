import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import database from '../config/database';
import { Room, RoomRow, RoomType } from '../models/Room';

class RoomService {
    private get db(): Pool {
        return database.getPool();
    }
    private validRoomTypes: RoomType[] = ['Standard', 'VIP', 'Premium', 'Suite'];

    private validateAndConvertType(type: string | undefined): RoomType {
        if (!type) {
            return 'Standard'; // Default type
        }
        if (!this.validRoomTypes.includes(type as RoomType)) {
            console.warn(`Invalid room type: ${type}. Using default 'Standard'`);
            return 'Standard'; // Sử dụng giá trị mặc định thay vì ném lỗi
        }

        return type as RoomType;
    }

    async isRoomNameExists(name: string, excludeId?: number): Promise<boolean> {
        try {
            let query = 'SELECT COUNT(*) as count FROM rooms WHERE name = ?';
            const params: any[] = [name];

            // If excludeId is provided, exclude that room from the check (for updates)
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }

            const [result] = await this.db.execute<RowDataPacket[]>(query, params);
            return (result[0] as any).count > 0;
        } catch (error) {
            console.error('Error checking room name existence:', error);
            throw new Error('Failed to check if room name exists');
        }
    }

    async createRoom(roomData: Partial<Room>): Promise<Room> {
        try {
            // Validate required fields
            if (!roomData.name || !roomData.price_per_hour || !roomData.capacity) {
                throw new Error('Missing required fields: name, price_per_hour, and capacity');
            }

            // Check if room name already exists
            const nameExists = await this.isRoomNameExists(roomData.name);
            if (nameExists) {
                throw new Error('Room name already exists. Please choose a different name.');
            }

            // Validate numeric values
            if (isNaN(Number(roomData.price_per_hour)) || isNaN(Number(roomData.capacity))) {
                throw new Error('Invalid price_per_hour or capacity value');
            }

            // Xử lý đặc biệt cho loại phòng 'Normal'
            let roomType = roomData.type as string;
            if (roomType === 'Normal') {
                roomType = 'Standard'; // Chuyển đổi 'Normal' thành 'Standard'
                console.log('Converting room type from Normal to Standard');
            }

            // Validate room type
            if (roomType && !this.validRoomTypes.includes(roomType as RoomType)) {
                console.warn(`Invalid room type: ${roomType}. Using default 'Standard'`);
                roomType = 'Standard'; // Sử dụng giá trị mặc định
            }

            // // Validate status
            // if (roomData.status && !this.validStatuses.includes(roomData.status as RoomStatus)) {
            //     throw new Error(`Invalid status. Must be one of: ${this.validStatuses.join(', ')}`);
            // }

            console.log('Creating room with data:', {
                ...roomData,
                type: roomType
            });

            const [result] = await this.db.execute<ResultSetHeader>(
                `INSERT INTO rooms (name, type, price_per_hour, capacity)
                 VALUES (?, ?, ?, ?)`,
                [
                    roomData.name.trim(),
                    roomType || 'Standard', // Sử dụng giá trị đã được xác thực
                    Number(roomData.price_per_hour),
                    Number(roomData.capacity)
                ]
            );

            if (result.affectedRows === 0) {
                throw new Error('Failed to create room in database');
            }

            console.log('Room created with ID:', result.insertId);

            // Fetch and return the created room
            const [rows] = await this.db.execute<RoomRow[]>(
                'SELECT * FROM rooms WHERE id = ?',
                [result.insertId]
            );

            if (!rows[0]) {
                throw new Error('Room created but failed to retrieve');
            }

            const createdRoom: Room = {
                id: rows[0].id,
                name: rows[0].name,
                type: this.validateAndConvertType(rows[0].type), // Use the validation helper
                price_per_hour: Number(rows[0].price_per_hour),
                capacity: Number(rows[0].capacity),
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at
            };

            console.log('Created room:', createdRoom);
            return createdRoom;

        } catch (error) {
            console.error('Error in createRoom:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to create room: ${error.message}`);
            }
            throw new Error('Failed to create room: Unknown error');
        }
    }

    async getRoomById(id: number): Promise<Room | null> {
        try {
            const [rows] = await this.db.execute<RoomRow[]>(
                'SELECT * FROM rooms WHERE id = ?',
                [id]
            );

            if (!rows[0]) {
                return null;
            }

            // Convert RoomRow to Room
            return {
                id: rows[0].id,
                name: rows[0].name,
                type: rows[0].type,
                price_per_hour: Number(rows[0].price_per_hour),
                capacity: Number(rows[0].capacity),
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at
            };
        } catch (error) {
            console.error('Error getting room:', error);
            throw error;
        }
    }

    async getAllRooms(): Promise<Room[]> {
        try {
            const [rows] = await this.db.execute<RoomRow[]>(
                'SELECT * FROM rooms ORDER BY name ASC'
            );

            // Convert RoomRow to Room
            return rows.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                price_per_hour: Number(row.price_per_hour),
                capacity: Number(row.capacity),
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        } catch (error) {
            console.error('Error getting all rooms:', error);
            throw error;
        }
    }

    async updateRoom(id: number, roomData: Partial<Room>): Promise<Room | null> {
        try {
            // Validate numeric values if they exist
            if (roomData.price_per_hour !== undefined && isNaN(Number(roomData.price_per_hour))) {
                throw new Error('Invalid price_per_hour value');
            }
            if (roomData.capacity !== undefined && isNaN(Number(roomData.capacity))) {
                throw new Error('Invalid capacity value');
            }

            // Check if room name already exists (excluding this room)
            if (roomData.name) {
                const nameExists = await this.isRoomNameExists(roomData.name, id);
                if (nameExists) {
                    throw new Error('Room name already exists. Please choose a different name.');
                }
            }

            // Validate room type if it exists
            if (roomData.type && !this.validRoomTypes.includes(roomData.type as RoomType)) {
                throw new Error(`Invalid room type. Must be one of: ${this.validRoomTypes.join(', ')}`);
            }

            // Remove any status field from roomData as it's not in the database schema
            const { status, ...validRoomData } = roomData as any;

            // Filter out undefined values and create SET clause
            const validUpdates = Object.entries(validRoomData)
                .filter(([_, value]) => value !== undefined)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, any>);

            if (Object.keys(validUpdates).length === 0) {
                throw new Error('No valid fields to update');
            }

            const setClause = Object.keys(validUpdates)
                .map(key => `${key} = ?`)
                .join(', ');
            const values = [...Object.values(validUpdates), id];

            const [result] = await this.db.execute<ResultSetHeader>(
                `UPDATE rooms SET ${setClause} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return null;
            }

            // Fetch and return updated room
            return this.getRoomById(id);
        } catch (error) {
            console.error('Error updating room:', error);
            throw error;
        }
    }

    async deleteRoom(id: number): Promise<boolean> {
        try {
            // First check if room has any bookings
            const [bookings] = await this.db.execute<RowDataPacket[]>(
                'SELECT COUNT(*) as count FROM bookings WHERE room_id = ?',
                [id]
            );

            if (bookings[0].count > 0) {
                throw new Error('Cannot delete room: Room has existing bookings');
            }

            // If no bookings exist, proceed with deletion
            const [result] = await this.db.execute<ResultSetHeader>(
                'DELETE FROM rooms WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting room:', error);
            throw error;
        }
    }
}

export default RoomService;
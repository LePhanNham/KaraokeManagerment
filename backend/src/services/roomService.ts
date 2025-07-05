import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import database from '../config/database';
import { Room, RoomEntity } from '../models/Room';

class RoomService {
    private async getDb(): Promise<Pool> {
        await database.initialize();
        return database.getPool();
    }

    async createRoom(roomData: Omit<Room, 'id'>): Promise<Room> {
        const db = await this.getDb();
        const [result] = await db.query<ResultSetHeader>(
            'INSERT INTO rooms (name, type, price_per_hour, capacity) VALUES (?, ?, ?, ?)',
            [roomData.name, roomData.type, roomData.price_per_hour, roomData.capacity]
        );

        return {
            id: result.insertId,
            ...roomData
        } as Room;
    }

    async getRooms(): Promise<Room[]> {
        const db = await this.getDb();
        const [rows] = await db.query<Room[]>(
            'SELECT id, name, type, price_per_hour, capacity FROM rooms'
        );
        return rows;
    }

    async getRoomById(id: number): Promise<Room | null> {
        const db = await this.getDb();
        const [rows] = await db.query<Room[]>(
            'SELECT id, name, type, price_per_hour, capacity FROM rooms WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    async updateRoom(id: number, updates: Partial<Room>): Promise<Room | null> {
        const db = await this.getDb();
        const fields = Object.keys(updates);
        const values = Object.values(updates);

        if (fields.length === 0) return null;

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        await db.query(
            `UPDATE rooms SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        return this.getRoomById(id);
    }

    async deleteRoom(id: number): Promise<void> {
        const db = await this.getDb();
        await db.query('DELETE FROM rooms WHERE id = ?', [id]);
    }

    async isRoomNameExists(name: string, excludeId?: number): Promise<boolean> {
        const db = await this.getDb();
        const query = excludeId
            ? 'SELECT 1 FROM rooms WHERE name = ? AND id != ? LIMIT 1'
            : 'SELECT 1 FROM rooms WHERE name = ? LIMIT 1';
        const params = excludeId ? [name, excludeId] : [name];
        
        const [rows] = await db.query<RowDataPacket[]>(query, params);
        return rows.length > 0;
    }
}

export default RoomService;
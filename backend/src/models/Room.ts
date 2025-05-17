import { RowDataPacket } from "mysql2";

export interface Room {
    id: number;
    name: string;
    type: RoomType;
    price_per_hour: number;
    capacity: number;
    created_at: Date;
    updated_at: Date;
}
export type RoomType = 'Standard' | 'VIP' | 'Premium' | 'Suite';
export interface RoomRow extends Room, RowDataPacket {}
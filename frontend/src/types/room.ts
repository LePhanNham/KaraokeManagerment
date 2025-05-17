export interface Room {
    id?: number;  // Optional for creation, required when returned from API,
    name: string;
    type: string;
    price_per_hour: number;
    capacity: number;
    status: 'available' | 'occupied' | 'maintenance';
    created_at?: Date;
    updated_at?: Date;
}

export type RoomFormData = Omit<Room, 'id' | 'created_at' | 'updated_at'>;

export type RoomStatus = 'available' | 'unavailable' | 'maintenance';

export interface RoomCardProps {
  room: Room;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
}
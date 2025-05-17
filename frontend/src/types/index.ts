export interface Room {
    id?: number;
    name: string;
    type: string;
    price_per_hour: number;
    capacity: number;
    status: RoomStatus;
    created_at?: Date;
    updated_at?: Date;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface Booking {
    id: string;
    roomId: string;
    customerName: string;
    bookingDate: Date;
    duration: number; // in hours
}

export interface RevenueReport {
    totalRevenue: number;
    bookingsCount: number;
}

export interface RoomUsageReport {
    roomId: string;
    usageCount: number;
}
import { RowDataPacket } from 'mysql2';

// Base interfaces
export interface Customer {
    id?: number;
    username: string;
    password: string;
    name: string | null;
    email: string;
    phone_number: string | null;
    role: 'user' | 'admin';
    created_at?: Date;
    updated_at?: Date;
}

export interface Room {
    id?: number;
    name: string;
    type: string;
    price_per_hour: number;
    capacity: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface Booking {
    id?: number;
    customer_id: number;
    total_amount: number;
    status: BookingStatus;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingRoom {
    id?: number;
    booking_id: number;
    room_id: number;
    start_time: Date;
    end_time: Date;
    check_in_time?: Date;
    check_out_time?: Date;
    price_per_hour: number;
    status: BookingRoomStatus;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Payment {
    id?: number;
    booking_id: number;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: Date;
    notes?: string;
}

// Enums
export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum BookingRoomStatus {
    PENDING = 'pending',
    IN_USE = 'in_use',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    TRANSFER = 'transfer'
}

// Database row interfaces
export interface CustomerRow extends Customer, RowDataPacket {}
export interface RoomRow extends Room, RowDataPacket {}
export interface BookingRow extends Booking, RowDataPacket {}
export interface BookingRoomRow extends BookingRoom, RowDataPacket {}
export interface PaymentRow extends Payment, RowDataPacket {}

// API response interfaces
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Request interfaces
export interface CreateBookingRequest {
    customer_id: number;
    rooms: {
        room_id: number;
        start_time: Date;
        end_time: Date;
        price_per_hour: number;
    }[];
    notes?: string;
}

export interface BookingDetailsResponse extends Booking {
    customer: Customer;
    rooms: (BookingRoom & {
        room: Room;
    })[];
    payments: Payment[];
}

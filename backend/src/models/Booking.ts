export interface Booking {
    id?: number;
    customer_id: number;
    start_time: Date;
    end_time: Date;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total_amount: number;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingRoom {
    id?: number;
    booking_id: number;
    room_id: number;
    price_per_hour: number;
    start_time: Date;
    end_time: Date;
    check_in_time?: Date;
    check_out_time?: Date;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingDetails extends Booking {
    rooms: Array<BookingRoom & {
        room_name: string;
        room_type: string;
    }>;
}

export interface CreateBookingDTO {
    customer_id: number;
    rooms: Array<{
        room_id: number;
        start_time: Date;
        end_time: Date;
        price_per_hour: number;
    }>;
    total_amount?: number;
    notes?: string;
}

export interface BookingRoomRequest {
    room_id: number;
    start_time: string | Date;
    end_time: string | Date;
    price_per_hour: number;
}

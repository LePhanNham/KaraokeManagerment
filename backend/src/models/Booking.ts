export interface Booking {
    id?: number;
    room_id: number;
    customer_id: number;
    start_time: Date;
    end_time: Date;
    notes?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total_amount?: number;
    booking_group_id?: number;
    payment_method?: 'cash' | 'card' | 'transfer' | 'e-wallet';
    payment_notes?: string;
    checkout_time?: Date;
    late_checkout_fee?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingGroup {
    id?: number;
    customer_id: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    total_amount: number;
    payment_status: 'unpaid' | 'partially_paid' | 'paid';
    created_at?: Date;
    updated_at?: Date;
}

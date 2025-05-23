export interface Payment {
    id?: number;
    booking_id?: number;
    booking_group_id?: number;
    amount: number;
    payment_method: string;
    payment_date: Date;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

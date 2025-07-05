import { Money } from './Room';
import { BaseEntity, ValidationResult } from './BaseEntity';
import { RowDataPacket } from 'mysql2';

// Enums
export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    TRANSFER = 'transfer',
    E_WALLET = 'e_wallet'
}

// Payment Class
export class Payment extends BaseEntity {
    private bookingId?: number;
    private bookingGroupId?: number;
    private bookingRoomId?: number;
    private customerId: number;
    private amount: Money;
    private paymentMethod: PaymentMethod;
    private transactionId?: string;
    private paymentDate: Date;
    private notes: string;

    constructor(
        id: number,
        customerId: number,
        amount: number,
        paymentMethod: PaymentMethod,
        bookingId?: number,
        bookingGroupId?: number,
        bookingRoomId?: number
    ) {
        super(id);
        this.customerId = customerId;
        this.amount = new Money(amount);
        this.paymentMethod = paymentMethod;
        this.bookingId = bookingId;
        this.bookingGroupId = bookingGroupId;
        this.bookingRoomId = bookingRoomId;
        this.paymentDate = new Date();
        this.notes = '';
    }

    // Getters
    getBookingId(): number | undefined {
        return this.bookingId;
    }

    getBookingGroupId(): number | undefined {
        return this.bookingGroupId;
    }

    getBookingRoomId(): number | undefined {
        return this.bookingRoomId;
    }

    getCustomerId(): number {
        return this.customerId;
    }

    getAmount(): Money {
        return this.amount;
    }

    getPaymentMethod(): PaymentMethod {
        return this.paymentMethod;
    }

    getTransactionId(): string | undefined {
        return this.transactionId;
    }

    getPaymentDate(): Date {
        return this.paymentDate;
    }

    getNotes(): string {
        return this.notes;
    }

    // Setters
    setAmount(amount: number): void {
        this.amount = new Money(amount);
        this.updateTimestamp();
    }

    setPaymentMethod(method: PaymentMethod): void {
        this.paymentMethod = method;
        this.updateTimestamp();
    }

    setTransactionId(transactionId: string): void {
        this.transactionId = transactionId;
        this.updateTimestamp();
    }

    setNotes(notes: string): void {
        this.notes = notes;
        this.updateTimestamp();
    }

    // Validation
    validate(): ValidationResult {
        const errors: string[] = [];

        if (this.customerId <= 0) {
            errors.push('Customer ID is required');
        }

        if (!this.amount.isPositive()) {
            errors.push('Payment amount must be greater than 0');
        }

        if (!this.bookingId && !this.bookingGroupId && !this.bookingRoomId) {
            errors.push('Payment must be associated with a booking, booking group, or booking room');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toString(): string {
        return `Payment[${this.id}]: ${this.amount.format()} via ${this.paymentMethod}`;
    }

    toJSON(): object {
        return {
            id: this.id,
            booking_id: this.bookingId,
            booking_group_id: this.bookingGroupId,
            booking_room_id: this.bookingRoomId,
            customer_id: this.customerId,
            amount: this.amount.getAmount(),
            payment_method: this.paymentMethod,
            transaction_id: this.transactionId,
            payment_date: this.paymentDate,
            notes: this.notes,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    // Static Factory Methods
    static create(
        customerId: number,
        amount: number,
        paymentMethod: PaymentMethod,
        bookingId?: number,
        bookingGroupId?: number,
        bookingRoomId?: number
    ): Payment {
        return new Payment(0, customerId, amount, paymentMethod, bookingId, bookingGroupId, bookingRoomId);
    }

    static fromJSON(data: any): Payment {
        const payment = new Payment(
            data.id,
            data.customer_id,
            data.amount,
            data.payment_method as PaymentMethod,
            data.booking_id,
            data.booking_group_id,
            data.booking_room_id
        );

        if (data.transaction_id) {
            payment.setTransactionId(data.transaction_id);
        }
        if (data.notes) {
            payment.setNotes(data.notes);
        }
        if (data.payment_date) {
            payment.paymentDate = new Date(data.payment_date);
        }
        return payment;
    }
}

// Interface for data representation
export interface PaymentData {
    id?: number;
    booking_id?: number;
    booking_group_id?: number;
    booking_room_id?: number;
    customer_id: number;
    amount: number;
    payment_method: PaymentMethod;
    transaction_id?: string;
    payment_date: Date;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

// Type for database operations
export type PaymentRow = PaymentData & RowDataPacket;

import { RowDataPacket } from 'mysql2';
import { Money } from './Room';
import { BaseEntity, ValidationResult } from './BaseEntity';

// Enums
export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum BookingRoomStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum BookingRoomPaymentStatus {
    UNPAID = 'unpaid',
    PARTIALLY_PAID = 'partially_paid',
    PAID = 'paid'
}

// Value Objects
export class TimeSlot {
    private startTime: Date;
    private endTime: Date;

    constructor(startTime: Date, endTime: Date) {
        if (startTime >= endTime) {
            throw new Error('Start time must be before end time');
        }
        this.startTime = startTime;
        this.endTime = endTime;
    }

    getStartTime(): Date {
        return this.startTime;
    }

    getEndTime(): Date {
        return this.endTime;
    }

    getDurationInHours(): number {
        return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
    }

    getDurationInMinutes(): number {
        return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60);
    }

    isValid(): boolean {
        return this.startTime < this.endTime;
    }

    overlapsWith(other: TimeSlot): boolean {
        return this.startTime < other.endTime && this.endTime > other.startTime;
    }

    contains(time: Date): boolean {
        return time >= this.startTime && time <= this.endTime;
    }

    equals(other: TimeSlot): boolean {
        return this.startTime.getTime() === other.startTime.getTime() &&
               this.endTime.getTime() === other.endTime.getTime();
    }

    toString(): string {
        return `${this.startTime.toISOString()} - ${this.endTime.toISOString()}`;
    }
}

// BookingRoom Class - simplified
export class BookingRoom extends BaseEntity {
    private bookingId: number;
    private roomId: number;
    private timeSlot: TimeSlot;
    private checkInTime?: Date;
    private checkOutTime?: Date;
    private pricePerHour: Money;
    private status: BookingRoomStatus;
    private paymentStatus: BookingRoomPaymentStatus;
    private notes: string;

    constructor(
        id: number,
        bookingId: number,
        roomId: number,
        startTime: Date,
        endTime: Date,
        pricePerHour: number
    ) {
        super(id);
        this.bookingId = bookingId;
        this.roomId = roomId;
        this.timeSlot = new TimeSlot(startTime, endTime);
        this.pricePerHour = new Money(pricePerHour);
        this.status = BookingRoomStatus.PENDING;
        this.paymentStatus = BookingRoomPaymentStatus.UNPAID;
        this.notes = '';
    }

    // Getters
    getBookingId(): number {
        return this.bookingId;
    }

    getRoomId(): number {
        return this.roomId;
    }

    getStartTime(): Date {
        return this.timeSlot.getStartTime();
    }

    getEndTime(): Date {
        return this.timeSlot.getEndTime();
    }

    getTimeSlot(): TimeSlot {
        return this.timeSlot;
    }

    getCheckInTime(): Date | undefined {
        return this.checkInTime;
    }

    getCheckOutTime(): Date | undefined {
        return this.checkOutTime;
    }

    getPricePerHour(): Money {
        return this.pricePerHour;
    }

    getStatus(): BookingRoomStatus {
        return this.status;
    }

    getPaymentStatus(): BookingRoomPaymentStatus {
        return this.paymentStatus;
    }

    getNotes(): string {
        return this.notes;
    }

    // Setters
    setCheckInTime(time: Date): void {
        this.checkInTime = time;
        this.updateTimestamp();
    }

    setCheckOutTime(time: Date): void {
        this.checkOutTime = time;
        this.updateTimestamp();
    }

    setStatus(status: BookingRoomStatus): void {
        this.status = status;
        this.updateTimestamp();
    }

    setPaymentStatus(paymentStatus: BookingRoomPaymentStatus): void {
        this.paymentStatus = paymentStatus;
        this.updateTimestamp();
    }

    setNotes(notes: string): void {
        this.notes = notes;
        this.updateTimestamp();
    }

    // Business Logic Methods
    calculateAmount(): Money {
        const hours = this.timeSlot.getDurationInHours();
        return this.pricePerHour.multiply(hours);
    }

    calculateDuration(): number {
        return this.timeSlot.getDurationInHours();
    }

    checkIn(): void {
        if (this.status !== BookingRoomStatus.PENDING) {
            throw new Error('Can only check in pending bookings');
        }
        this.checkInTime = new Date();
        this.status = BookingRoomStatus.CONFIRMED;
        this.updateTimestamp();
    }

    checkOut(): void {
        if (this.status !== BookingRoomStatus.CONFIRMED) {
            throw new Error('Can only check out rooms that are in use');
        }
        this.checkOutTime = new Date();
        this.status = BookingRoomStatus.COMPLETED;
        this.updateTimestamp();
    }

    isPending(): boolean {
        return this.status === BookingRoomStatus.PENDING;
    }

    isInUse(): boolean {
        return this.status === BookingRoomStatus.CONFIRMED;
    }

    isCompleted(): boolean {
        return this.status === BookingRoomStatus.COMPLETED;
    }

    isCancelled(): boolean {
        return this.status === BookingRoomStatus.CANCELLED;
    }

    validate(): ValidationResult {
        const errors: string[] = [];

        if (this.bookingId <= 0) {
            errors.push('Booking ID is required');
        }

        if (this.roomId <= 0) {
            errors.push('Room ID is required');
        }

        if (!this.timeSlot.isValid()) {
            errors.push('Invalid time slot');
        }

        if (!this.pricePerHour.isPositive()) {
            errors.push('Price per hour must be greater than 0');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    hasTimeConflictWith(other: BookingRoom): boolean {
        return this.roomId === other.roomId && this.timeSlot.overlapsWith(other.timeSlot);
    }

    equals(other: BookingRoom): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return `BookingRoom[${this.id}]: Room ${this.roomId} from ${this.timeSlot.toString()} - ${this.calculateAmount().format()}`;
    }

    toJSON(): object {
        return {
            id: this.id,
            booking_id: this.bookingId,
            room_id: this.roomId,
            start_time: this.timeSlot.getStartTime(),
            end_time: this.timeSlot.getEndTime(),
            check_in_time: this.checkInTime,
            check_out_time: this.checkOutTime,
            price_per_hour: this.pricePerHour.getAmount(),
            status: this.status,
            payment_status: this.paymentStatus,
            notes: this.notes,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    // Static Factory Methods
    static fromJSON(data: any): BookingRoom {
        const bookingRoom = new BookingRoom(
            data.id,
            data.booking_id,
            data.room_id,
            new Date(data.start_time),
            new Date(data.end_time),
            data.price_per_hour
        );

        if (data.check_in_time) {
            bookingRoom.setCheckInTime(new Date(data.check_in_time));
        }
        if (data.check_out_time) {
            bookingRoom.setCheckOutTime(new Date(data.check_out_time));
        }
        if (data.status) {
            bookingRoom.setStatus(data.status as BookingRoomStatus);
        }
        if (data.payment_status) {
            bookingRoom.setPaymentStatus(data.payment_status as BookingRoomPaymentStatus);
        }
        if (data.notes) {
            bookingRoom.setNotes(data.notes);
        }

        return bookingRoom;
    }

    static create(
        bookingId: number,
        roomId: number,
        startTime: Date,
        endTime: Date,
        pricePerHour: number
    ): BookingRoom {
        return new BookingRoom(0, bookingId, roomId, startTime, endTime, pricePerHour);
    }
}

// Booking Class - simplified
export class Booking extends BaseEntity {
    private customerId: number;
    private timeSlot: TimeSlot;
    private status: BookingStatus;
    private totalAmount: Money;
    private notes: string;
    private bookingRooms: BookingRoom[];

    constructor(
        id: number,
        customerId: number,
        startTime: Date,
        endTime: Date,
        totalAmount: number = 0
    ) {
        super(id);
        this.customerId = customerId;
        this.timeSlot = new TimeSlot(startTime, endTime);
        this.status = BookingStatus.PENDING;
        this.totalAmount = new Money(totalAmount);
        this.notes = '';
        this.bookingRooms = [];
    }

    // Getters
    getCustomerId(): number {
        return this.customerId;
    }

    getStartTime(): Date {
        return this.timeSlot.getStartTime();
    }

    getEndTime(): Date {
        return this.timeSlot.getEndTime();
    }

    getTimeSlot(): TimeSlot {
        return this.timeSlot;
    }

    getStatus(): BookingStatus {
        return this.status;
    }

    getTotalAmount(): Money {
        return this.totalAmount;
    }

    getNotes(): string {
        return this.notes;
    }

    getBookingRooms(): BookingRoom[] {
        return this.bookingRooms;
    }

    // Setters
    setStatus(status: BookingStatus): void {
        this.status = status;
        this.updateTimestamp();
    }

    setNotes(notes: string): void {
        this.notes = notes;
        this.updateTimestamp();
    }

    setTotalAmount(amount: number): void {
        this.totalAmount = new Money(amount);
        this.updateTimestamp();
    }

    // Business Logic Methods
    addRoom(roomId: number, startTime: Date, endTime: Date, pricePerHour: number): BookingRoom {
        const bookingRoom = BookingRoom.create(this.id, roomId, startTime, endTime, pricePerHour);
        this.bookingRooms.push(bookingRoom);
        this.recalculateTotalAmount();
        this.updateTimestamp();
        return bookingRoom;
    }

    removeRoom(roomId: number): void {
        this.bookingRooms = this.bookingRooms.filter(br => br.getRoomId() !== roomId);
        this.recalculateTotalAmount();
        this.updateTimestamp();
    }

    calculateTotalAmount(): Money {
        return this.bookingRooms.reduce(
            (total, room) => total.add(room.calculateAmount()),
            new Money(0)
        );
    }

    calculateDuration(): number {
        return this.timeSlot.getDurationInHours();
    }

    isPending(): boolean {
        return this.status === BookingStatus.PENDING;
    }

    isConfirmed(): boolean {
        return this.status === BookingStatus.CONFIRMED;
    }

    isCompleted(): boolean {
        return this.status === BookingStatus.COMPLETED;
    }

    isCancelled(): boolean {
        return this.status === BookingStatus.CANCELLED;
    }

    canBeCancelled(): boolean {
        return this.status === BookingStatus.PENDING || this.status === BookingStatus.CONFIRMED;
    }

    canBeModified(): boolean {
        return this.status === BookingStatus.PENDING;
    }

    confirm(): void {
        if (!this.isPending()) {
            throw new Error('Only pending bookings can be confirmed');
        }
        this.status = BookingStatus.CONFIRMED;
        this.updateTimestamp();
    }

    cancel(): void {
        if (!this.canBeCancelled()) {
            throw new Error('Booking cannot be cancelled in current status');
        }
        this.status = BookingStatus.CANCELLED;
        this.bookingRooms.forEach(room => room.setStatus(BookingRoomStatus.CANCELLED));
        this.updateTimestamp();
    }

    complete(): void {
        if (!this.isConfirmed()) {
            throw new Error('Only confirmed bookings can be completed');
        }
        this.status = BookingStatus.COMPLETED;
        this.bookingRooms.forEach(room => {
            if (room.isInUse()) {
                room.checkOut();
            }
        });
        this.updateTimestamp();
    }

    validate(): ValidationResult {
        const errors: string[] = [];

        if (this.customerId <= 0) {
            errors.push('Customer ID is required');
        }

        if (!this.timeSlot.isValid()) {
            errors.push('Invalid time slot');
        }

        if (this.bookingRooms.length === 0) {
            errors.push('At least one room must be booked');
        }

        // Validate each booking room
        this.bookingRooms.forEach((room, index) => {
            const roomValidation = room.validate();
            if (!roomValidation.isValid) {
                errors.push(`Room ${index + 1}: ${roomValidation.errors.join(', ')}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    hasConflictWith(other: Booking): boolean {
        return this.bookingRooms.some(myRoom =>
            other.bookingRooms.some(otherRoom =>
                myRoom.hasTimeConflictWith(otherRoom)
            )
        );
    }

    equals(other: Booking): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return `Booking[${this.id}]: Customer ${this.customerId} from ${this.timeSlot.toString()} - ${this.totalAmount.format()} (${this.status})`;
    }

    toJSON(): object {
        return {
            id: this.id,
            customer_id: this.customerId,
            start_time: this.timeSlot.getStartTime(),
            end_time: this.timeSlot.getEndTime(),
            status: this.status,
            total_amount: this.totalAmount.getAmount(),
            notes: this.notes,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
            rooms: this.bookingRooms.map(room => room.toJSON())
        };
    }

    private recalculateTotalAmount(): void {
        this.totalAmount = this.calculateTotalAmount();
    }

    // Static Factory Methods
    static fromJSON(data: any): Booking {
        const booking = new Booking(
            data.id,
            data.customer_id,
            new Date(data.start_time),
            new Date(data.end_time),
            data.total_amount
        );

        if (data.status) {
            booking.setStatus(data.status as BookingStatus);
        }
        if (data.notes) {
            booking.setNotes(data.notes);
        }
        if (data.rooms && Array.isArray(data.rooms)) {
            booking.bookingRooms = data.rooms.map((roomData: any) => BookingRoom.fromJSON(roomData));
        }

        return booking;
    }

    static create(
        customerId: number,
        startTime: Date,
        endTime: Date,
        notes?: string
    ): Booking {
        const booking = new Booking(0, customerId, startTime, endTime);
        if (notes) {
            booking.setNotes(notes);
        }
        return booking;
    }
}

// Interface for data representation
export interface BookingData {
    id?: number;
    customer_id: number;
    start_time: Date;
    end_time: Date;
    status: BookingStatus;
    total_amount: number;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface BookingRoomData {
    id?: number;
    booking_id: number;
    room_id: number;
    price_per_hour: number;
    start_time: Date;
    end_time: Date;
    check_in_time?: Date;
    check_out_time?: Date;
    status: BookingRoomStatus;
    payment_status: BookingRoomPaymentStatus;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

// Types for database operations
export type BookingRow = BookingData & RowDataPacket;
export type BookingRoomRow = BookingRoomData & RowDataPacket;

// DTOs
export interface BookingDetails {
    booking: Booking;
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

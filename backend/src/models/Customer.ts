import { RowDataPacket } from 'mysql2';
import { BaseEntity, ValidationResult } from './BaseEntity';

// Enums
export enum MembershipLevel {
    BRONZE = 'bronze',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum',
    VIP = 'vip'
}

// Value Objects
export class ContactInfo {
    private phone: string;
    private email: string;
    private address: string;

    constructor(phone: string, email: string = '', address: string = '') {
        this.phone = phone;
        this.email = email;
        this.address = address;
    }

    getPhone(): string {
        return this.phone;
    }

    getEmail(): string {
        return this.email;
    }

    getAddress(): string {
        return this.address;
    }

    setPhone(phone: string): void {
        if (!this.validatePhone(phone)) {
            throw new Error('Invalid phone number format');
        }
        this.phone = phone;
    }

    setEmail(email: string): void {
        if (email && !this.validateEmail(email)) {
            throw new Error('Invalid email format');
        }
        this.email = email;
    }

    setAddress(address: string): void {
        this.address = address;
    }

    isValidPhone(): boolean {
        return this.validatePhone(this.phone);
    }

    isValidEmail(): boolean {
        return !this.email || this.validateEmail(this.email);
    }

    private validatePhone(phone: string): boolean {
        const phoneRegex = /^[0-9]{10,11}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    equals(other: ContactInfo): boolean {
        return this.phone === other.phone && this.email === other.email && this.address === other.address;
    }

    toString(): string {
        return `Phone: ${this.phone}, Email: ${this.email}, Address: ${this.address}`;
    }
}

// Customer Class - simplified
export class Customer extends BaseEntity {
    private name: string;
    private contactInfo: ContactInfo;
    private dateOfBirth?: Date;
    private membershipLevel: MembershipLevel;
    private totalSpent: number;
    private visitCount: number;

    constructor(
        id: number,
        name: string,
        phone: string,
        email?: string,
        address?: string
    ) {
        super(id);
        this.name = name;
        this.contactInfo = new ContactInfo(phone, email || '', address || '');
        this.membershipLevel = MembershipLevel.BRONZE;
        this.totalSpent = 0;
        this.visitCount = 0;
    }

    // Getters
    getName(): string {
        return this.name;
    }

    getPhone(): string {
        return this.contactInfo.getPhone();
    }

    getEmail(): string {
        return this.contactInfo.getEmail();
    }

    getAddress(): string {
        return this.contactInfo.getAddress();
    }

    getContactInfo(): ContactInfo {
        return this.contactInfo;
    }

    getDateOfBirth(): Date | undefined {
        return this.dateOfBirth;
    }

    getMembershipLevel(): MembershipLevel {
        return this.membershipLevel;
    }

    getTotalSpent(): number {
        return this.totalSpent;
    }

    getVisitCount(): number {
        return this.visitCount;
    }

    // Setters
    setName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('Customer name cannot be empty');
        }
        this.name = name.trim();
        this.updateTimestamp();
    }

    setPhone(phone: string): void {
        this.contactInfo.setPhone(phone);
        this.updateTimestamp();
    }

    setEmail(email: string): void {
        this.contactInfo.setEmail(email);
        this.updateTimestamp();
    }

    setAddress(address: string): void {
        this.contactInfo.setAddress(address);
        this.updateTimestamp();
    }

    setDateOfBirth(date: Date): void {
        if (date > new Date()) {
            throw new Error('Date of birth cannot be in the future');
        }
        this.dateOfBirth = date;
        this.updateTimestamp();
    }

    setMembershipLevel(level: MembershipLevel): void {
        this.membershipLevel = level;
        this.updateTimestamp();
    }

    // Business Logic Methods - simplified
    addSpent(amount: number): void {
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        this.totalSpent += amount;
        this.updateTimestamp();
    }

    incrementVisitCount(): void {
        this.visitCount++;
        this.updateTimestamp();
    }

    isVIP(): boolean {
        return this.membershipLevel === MembershipLevel.VIP || this.membershipLevel === MembershipLevel.PLATINUM;
    }

    validate(): ValidationResult {
        const errors: string[] = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Customer name is required');
        }

        if (!this.contactInfo.isValidPhone()) {
            errors.push('Valid phone number is required');
        }

        if (!this.contactInfo.isValidEmail()) {
            errors.push('Valid email format is required');
        }

        if (this.dateOfBirth && this.dateOfBirth > new Date()) {
            errors.push('Date of birth cannot be in the future');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    equals(other: Customer): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return `Customer[${this.id}]: ${this.name} (${this.contactInfo.getPhone()}) - ${this.membershipLevel}`;
    }

    toJSON(): object {
        return {
            id: this.id,
            name: this.name,
            phone: this.contactInfo.getPhone(),
            email: this.contactInfo.getEmail(),
            address: this.contactInfo.getAddress(),
            date_of_birth: this.dateOfBirth,
            membership_level: this.membershipLevel,
            total_spent: this.totalSpent,
            visit_count: this.visitCount,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }



    // Static Factory Methods
    static fromJSON(data: any): Customer {
        const customer = new Customer(
            data.id,
            data.name,
            data.phone,
            data.email,
            data.address
        );

        if (data.date_of_birth) {
            customer.setDateOfBirth(new Date(data.date_of_birth));
        }
        if (data.membership_level) {
            customer.setMembershipLevel(data.membership_level as MembershipLevel);
        }
        if (data.total_spent) {
            customer.totalSpent = data.total_spent;
        }
        if (data.visit_count) {
            customer.visitCount = data.visit_count;
        }

        return customer;
    }

    static create(
        name: string,
        phone: string,
        email?: string,
        address?: string
    ): Customer {
        return new Customer(0, name, phone, email, address);
    }
}

// Interface for data representation
export interface CustomerData {
    id?: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    date_of_birth?: Date;
    membership_level: MembershipLevel;
    total_spent: number;
    visit_count: number;
    created_at?: Date;
    updated_at?: Date;
}

// Authentication data interface
export interface UserData {
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

// Types for database operations
export type CustomerRow = CustomerData & RowDataPacket;
export type UserRow = UserData & RowDataPacket;

export default Customer;
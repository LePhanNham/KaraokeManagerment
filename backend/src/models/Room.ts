import { RowDataPacket } from "mysql2";
import { BaseEntity, ValidationResult } from './BaseEntity';

export interface Room extends RowDataPacket {
  id?: number;
  name: string;
  type: string;
  price_per_hour: number;
  capacity: number;
}

export class Money {
    private amount: number;
    private currency: string;

    constructor(amount: number, currency: string = 'VND') {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        this.amount = amount;
        this.currency = currency;
    }

    getAmount(): number {
        return this.amount;
    }

    getCurrency(): string {
        return this.currency;
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add different currencies');
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot subtract different currencies');
        }
        return new Money(this.amount - other.amount, this.currency);
    }

    multiply(factor: number): Money {
        return new Money(this.amount * factor, this.currency);
    }

    isPositive(): boolean {
        return this.amount > 0;
    }

    format(): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: this.currency
        }).format(this.amount);
    }
}

export class RoomEntity extends BaseEntity {
  protected name: string;
  protected type: string;
  protected price_per_hour: number;
  protected capacity: number;

  constructor(room: Room) {
    super(room.id || 0);
    this.name = room.name;
    this.type = room.type;
    this.price_per_hour = room.price_per_hour;
    this.capacity = room.capacity;
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Tên phòng là bắt buộc');
    }
    if (!this.type || this.type.trim().length === 0) {
      errors.push('Loại phòng là bắt buộc');
    }
    if (this.price_per_hour < 0) {
      errors.push('Giá phòng không được âm');
    }
    if (this.capacity < 1) {
      errors.push('Sức chứa phải lớn hơn 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toString(): string {
    return `Phòng ${this.name} (${this.type})`;
  }

  toJSON(): Room {
    return {
      id: this.getId(),
      name: this.name,
      type: this.type,
      price_per_hour: this.price_per_hour,
      capacity: this.capacity
    } as Room;
  }
}
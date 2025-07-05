// Base validation interface
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Base entity class - simplified
export abstract class BaseEntity {
    protected id: number;
    protected createdAt: Date;
    protected updatedAt: Date;

    constructor(id: number) {
        this.id = id;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Getters cơ bản
    getId(): number {
        return this.id;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    // Update timestamp when changes occur
    protected updateTimestamp(): void {
        this.updatedAt = new Date();
    }

    // Abstract methods - must be implemented
    abstract validate(): ValidationResult;
    abstract toJSON(): object;
    abstract toString(): string;
}
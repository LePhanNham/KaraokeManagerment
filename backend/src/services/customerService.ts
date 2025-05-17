import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import Customer from '../models/Customer';
import database from '../config/database';
import bcrypt from 'bcrypt';

interface CustomerRow extends RowDataPacket, Customer {}

class CustomerService {
    private db: Pool;

    constructor() {
        this.db = database.getPool();
    }

    async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
        if (!this.validateCustomerData(customerData)) {
            throw new Error('Invalid customer data');
        }

        try {
            const [result] = await this.db.execute<ResultSetHeader>(
                'INSERT INTO customers (username, password, name, email, phone_number) VALUES (?, ?, ?, ?, ?)',
                [
                    customerData.username,
                    customerData.password,
                    customerData.name,
                    customerData.email,
                    customerData.phone_number
                ]
            );

            const customer = await this.getCustomerById(result.insertId);
            if (!customer) {
                throw new Error('Failed to retrieve created customer');
            }
            return customer;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create customer: ${error.message}`);
            }
            throw new Error('Failed to create customer: Unknown error');
        }
    }

    private validateCustomerData(customerData: Partial<Customer>): boolean {
        return !!(customerData.username && 
                 customerData.password && 
                 customerData.email &&
                 this.validateEmail(customerData.email));
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private async ensureCustomer(customer: Customer | null): Promise<Customer> {
        if (!customer) {
            throw new Error('Customer not found');
        }
        return customer;
    }

    async getCustomerByUsername(username: string): Promise<Customer | null> {
        const [rows] = await this.db.execute<CustomerRow[]>(
            'SELECT * FROM customers WHERE username = ?',
            [username]
        );
        return rows[0] || null;
    }

    async getCustomerById(id: number): Promise<Customer> {
        const [rows] = await this.db.execute<CustomerRow[]>(
            'SELECT * FROM customers WHERE id = ?',
            [id]
        );
        return this.ensureCustomer(rows[0] || null);
    }

    async getCustomerByEmail(email: string) {
        try {
            const [rows] = await this.db.execute<CustomerRow[]>(
                'SELECT * FROM customers WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to get customer by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async updateCustomer(id: number, updateData: Partial<Customer>): Promise<Customer> {
        // Remove sensitive fields from update
        delete updateData.password;
        delete updateData.created_at;

        const setClause = Object.keys(updateData)
            .map(key => `${key} = ?`)
            .join(', ');
        
        try {
            await this.db.execute(
                `UPDATE customers SET ${setClause} WHERE id = ?`,
                [...Object.values(updateData), id]
            );

            return this.getCustomerById(id);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update customer: ${error.message}`);
            }
            throw new Error('Failed to update customer: Unknown error');
        }
    }

    async deleteCustomer(id: number): Promise<boolean> {
        try {
            const [result] = await this.db.execute<ResultSetHeader>(
                'DELETE FROM customers WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete customer: ${error.message}`);
            }
            throw new Error('Failed to delete customer: Unknown error');
        }
    }

    async getAllCustomers(): Promise<Customer[]> {
        try {
            const [rows] = await this.db.execute<CustomerRow[]>(
                'SELECT id, username, name, email, phone_number, created_at, updated_at FROM customers'
            );
            return rows;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch customers: ${error.message}`);
            }
            throw new Error('Failed to fetch customers: Unknown error');
        }
    }

    async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
        try {
            const [result] = await this.db.execute<ResultSetHeader>(
                'UPDATE customers SET password = ? WHERE id = ?',
                [hashedPassword, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update password: ${error.message}`);
            }
            throw new Error('Failed to update password: Unknown error');
        }
    }
}

export default CustomerService;
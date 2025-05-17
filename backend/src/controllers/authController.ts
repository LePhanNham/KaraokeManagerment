import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import CustomerService from '../services/customerService';

class AuthController {
    private customerService: CustomerService;

    constructor() {
        this.customerService = new CustomerService();
    }

    async register(req: Request, res: Response) {
        try {
            const { username, password, name, email, phone_number } = req.body;

            // Validate required fields
            if (!username || !password || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, password and email are required'
                });
            }

            // Check if user already exists
            const existingUser = await this.customerService.getCustomerByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create customer
            const customer = await this.customerService.createCustomer({
                username,
                password: hashedPassword,
                name,
                email,
                phone_number
            });

            // Generate token
            const token = jwt.sign(
                { id: customer.id, username: customer.username },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                data: {
                    token,
                    customer: {
                        id: customer.id,
                        username: customer.username,
                        name: customer.name,
                        email: customer.email
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error registering user',
                error: (error instanceof Error) ? error.message : 'An unknown error occurred'
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;

            // Validate input
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            // Find user
            const customer = await this.customerService.getCustomerByUsername(username);
            if (!customer) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, customer.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = jwt.sign(
                { id: customer.id, username: customer.username },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                data: {
                    token,
                    customer: {
                        id: customer.id,
                        username: customer.username,
                        name: customer.name,
                        email: customer.email
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error logging in',
                error: (error instanceof Error) ? error.message : 'An unknown error occurred'
            });
        }
    }
}

export default AuthController;
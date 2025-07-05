import { Request, Response } from 'express';
import CustomerService from '../services/customerService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/Customer';

// // Add custom error types
// class ApplicationError extends Error {
//     constructor(message: string) {
//         super(message);
//         this.name = 'ApplicationError';
//     }
// }

class CustomerController {
    private customerService: CustomerService;

    constructor() {
        this.customerService = new CustomerService();
        // Bind methods to instance
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.getCustomerById = this.getCustomerById.bind(this);
        this.updateCustomer = this.updateCustomer.bind(this);
        this.getAllCustomers = this.getAllCustomers.bind(this);
        this.deleteCustomer = this.deleteCustomer.bind(this);
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

            // Add email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Check existing username
            const existingUsername = await this.customerService.getCustomerByUsername(username);
            if (existingUsername) {
                return res.status(409).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            // Check existing email
            const existingEmail = await this.customerService.getCustomerByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create customer (User for authentication)
            const customer = await this.customerService.createCustomer({
                username,
                password: hashedPassword,
                name: name || username,
                email,
                phone_number,
                role: 'user'
            } as any);

            // Generate token
            const token = this.generateToken(customer);

            // Return success response
            res.status(201).json({
                success: true,
                data: {
                    token,
                    customer: this.sanitizeCustomer(customer)
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register user',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            const customer = await this.customerService.getCustomerByUsername(username);
            if (!customer) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isValidPassword = await bcrypt.compare(password, (customer as any).password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const token = this.generateToken(customer);

            res.json({
                success: true,
                data: {
                    token,
                    customer: this.sanitizeCustomer(customer)
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }

    async getProfile(req: AuthRequest, res: Response) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const customer = await this.customerService.getCustomerById(req.user.id);
            res.json({
                success: true,
                data: this.sanitizeCustomer(customer)
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve profile'
            });
        }
    }

    async updateProfile(req: AuthRequest, res: Response) {
        try {
            console.log('Update Profile - User ID:', req.user?.id);
            console.log('Update Profile - Request Body:', req.body);

            const customer = await this.customerService.updateCustomer(req.user!.id, req.body);
            console.log('Update Profile - Updated Customer:', customer);

            res.json({
                success: true,
                data: this.sanitizeCustomer(customer)
            });
        } catch (error: unknown) {
            console.error('Update Profile Error:', error);
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'An unexpected error occurred'
                });
            }
        }
    }

    async updateCustomer(req: Request, res: Response) {
        try {
            const customerId = parseInt(req.params.id);
            if (isNaN(customerId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid customer ID'
                });
            }

            const updateData = req.body;
            // Remove sensitive fields from update data
            delete updateData.password;
            delete updateData.role;

            const customer = await this.customerService.updateCustomer(customerId, updateData);

            res.json({
                success: true,
                data: this.sanitizeCustomer(customer)
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'An unexpected error occurred'
                });
            }
        }
    }

    async getCustomerById(req: Request, res: Response) {
        try {
            const customer = await this.customerService.getCustomerById(parseInt(req.params.id));
            res.json({
                success: true,
                data: this.sanitizeCustomer(customer)
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'An unexpected error occurred'
                });
            }
        }
    }

    async getAllCustomers(req: Request, res: Response) {
        try {
            const customers = await this.customerService.getAllCustomers();
            res.json({
                success: true,
                data: customers.map(this.sanitizeCustomer)
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'An unexpected error occurred'
                });
            }
        }
    }

    async deleteCustomer(req: Request, res: Response) {
        try {
            await this.customerService.deleteCustomer(parseInt(req.params.id));
            res.json({
                success: true,
                message: 'Customer deleted successfully'
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'An unexpected error occurred'
                });
            }
        }
    }

    async changePassword(req: AuthRequest, res: Response) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            // Validate password length
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters long'
                });
            }

            // Get current user
            const customer = await this.customerService.getCustomerById(req.user!.id);

            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, (customer as any).password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await this.customerService.updatePassword(req.user!.id, hashedPassword);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    }

    private generateToken(customer: any): string {
        return jwt.sign(
            {
                id: customer.id,
                username: customer.username,
                role: customer.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }

    private sanitizeCustomer(customer: any) {
        return {
            id: customer.id,
            username: customer.username,
            name: customer.name,
            email: customer.email,
            phone_number: customer.phone_number,
            role: customer.role
        };
    }
}

export default CustomerController;
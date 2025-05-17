import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer';
import CustomerService from '../services/customerService';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role?: string;
    }
}

const customerService = new CustomerService();

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Add user info to request
            (req as AuthRequest).user = decoded as { id: number; username: string; role?: string };
            
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Middleware for admin only routes
export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // First authenticate the user
        auth(req, res, (err?: any) => {
            if (err) return next(err);
            
            // Then check if they're an admin
            if (req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }
            next();
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Middleware to check if user is accessing their own data
export const selfOrAdminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // First authenticate the user
        auth(req, res, (err?: any) => {
            if (err) return next(err);
            
            // Then check if they're accessing their own data or are an admin
            const userId = parseInt(req.params.id);
            if (req.user?.id !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own data.'
                });
            }
            next();
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};
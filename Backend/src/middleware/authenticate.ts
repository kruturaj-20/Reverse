import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import User from '../models/User';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

export const authenticate = asyncHandler(
    async (req: AuthRequest, _res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication token is required', 401);
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, config.jwt.secret) as {
            id: string;
            email: string;
            name: string;
            iat: number;
            exp: number;
        };

        // Ensure user still exists in DB (handles case where user was deleted)
        const user = await User.findById(decoded.id).select('_id name email');
        if (!user) {
            throw new AppError('User belonging to this token no longer exists', 401);
        }

        req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
        next();
    }
);

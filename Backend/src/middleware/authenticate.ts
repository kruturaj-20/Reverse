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
        role: string;
    };
}

export const authenticate = asyncHandler(
    async (req: AuthRequest, _res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication token is required', 401);
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, config.jwt.secret, {
            algorithms: ['HS256'], // Prevent algorithm confusion attacks
        }) as {
            id: string;
            email: string;
            name: string;
            role: string;
            iat: number;
            exp: number;
        };

        // Always fetch from DB — ensures user still exists AND gets latest role
        // (important if role was changed or user was deleted after token was issued)
        const user = await User.findById(decoded.id).select('_id name email role');
        if (!user) {
            throw new AppError('User belonging to this token no longer exists', 401);
        }

        // Use DB role (not token role) to prevent privilege escalation via old tokens
        req.user = { id: decoded.id, email: decoded.email, name: decoded.name, role: user.role };
        next();
    }
);

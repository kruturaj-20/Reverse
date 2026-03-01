import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { AppError } from '../utils/AppError';

/**
 * Authorization middleware — restricts routes to specific roles.
 * Must be used AFTER `authenticate` middleware.
 *
 * Usage: router.post('/', authenticate, authorize('admin'), handler)
 */
export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

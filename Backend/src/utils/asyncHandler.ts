import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async route handler and forwards any thrown errors to Express's
 * next(err) error-handling middleware, eliminating try-catch boilerplate.
 */
export const asyncHandler =
    (fn: AsyncHandler) =>
        (req: Request, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };

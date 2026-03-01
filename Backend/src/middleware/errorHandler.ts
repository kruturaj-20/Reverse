import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';
import { config } from '../config';

// Sanitize request body before logging — redact sensitive fields
const sanitizeBody = (body: any): any => {
    if (!body || typeof body !== 'object') return body;
    const SENSITIVE_KEYS = ['password', 'token', 'refreshToken', 'secret', 'creditCard', 'cvv'];
    const sanitized = { ...body };
    SENSITIVE_KEYS.forEach(key => {
        if (key in sanitized) sanitized[key] = '[REDACTED]';
    });
    return sanitized;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error({
        message: err.message,
        stack: config.nodeEnv === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        // Only log body in development, always sanitize sensitive fields
        ...(config.nodeEnv === 'development' && { body: sanitizeBody(req.body) }),
    });

    // Known operational errors
    if (err instanceof AppError) {
        sendError(res, err.message, err.statusCode);
        return;
    }

    // Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
        const errors: Record<string, string[]> = {};
        Object.entries(err.errors).forEach(([key, val]) => {
            errors[key] = [val.message];
        });
        sendError(res, 'Validation failed', 400, errors);
        return;
    }

    // Mongoose duplicate key error
    if ((err as NodeJS.ErrnoException & { code?: number }).code === 11000) {
        const field = Object.keys(
            (err as unknown as { keyValue: Record<string, unknown> }).keyValue
        )[0];
        sendError(res, `${field} already exists`, 409);
        return;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        sendError(res, `Invalid ${err.path}: ${err.value}`, 400);
        return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        sendError(res, 'Invalid token', 401);
        return;
    }

    if (err.name === 'TokenExpiredError') {
        sendError(res, 'Token expired', 401);
        return;
    }

    // Unknown errors — never leak internal details in production
    const message =
        config.nodeEnv === 'development' ? err.message : 'Internal server error';
    sendError(res, message, 500);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

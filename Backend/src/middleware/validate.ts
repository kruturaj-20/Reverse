import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse';

/**
 * Runs after express-validator chains. If there are validation errors,
 * responds with 422 and a structured errors map. Otherwise calls next().
 */
export const validate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMap: Record<string, string[]> = {};
        errors.array().forEach((err) => {
            const field = err.type === 'field' ? err.path : '_general';
            if (!errorMap[field]) errorMap[field] = [];
            errorMap[field].push(err.msg);
        });
        sendError(res, 'Validation failed', 422, errorMap);
        return;
    }
    next();
};

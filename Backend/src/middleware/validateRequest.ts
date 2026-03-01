import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validateRequest = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Map Zod errors to a generic error message listing the invalid fields
                const zodError = error as any;
                const errorMessages = zodError.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new AppError(`Validation failed: ${errorMessages}`, 400));
            } else {
                next(error);
            }
        }
    };
};

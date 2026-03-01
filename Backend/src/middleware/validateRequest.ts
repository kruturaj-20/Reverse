import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, ZodIssue } from 'zod';
import { sendError } from '../utils/apiResponse';

export const validateRequest = (schema: ZodObject<any>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Map errors to field -> messages[], stripping internal path prefixes
                const fieldErrors: Record<string, string[]> = {};
                error.issues.forEach((issue: ZodIssue) => {
                    // issue.path is e.g. ['body', 'email'] or ['query', 'limit']
                    // We strip the first segment ('body'/'query'/'params') for cleaner output
                    const field = issue.path.slice(1).join('.') || '_general';
                    if (!fieldErrors[field]) fieldErrors[field] = [];
                    fieldErrors[field].push(issue.message);
                });
                sendError(res, 'Validation failed', 422, fieldErrors);
                return;
            }
            next(error);
        }
    };
};

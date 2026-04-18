import { z } from 'zod';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * Higher-order middleware to validate req.body, req.query, and req.params using Zod.
 * 
 * @param {z.ZodSchema} schema - The Zod schema to validate against (should have body, query, params objects if needed)
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!parsed.success) {
            const formattedErrors = parsed.error.issues.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));

            logger.warn('Validation error', {
                errors: formattedErrors,
                path: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });

            // Pass to global error handler
            return next(new AppError('Validation failed', 400, { details: formattedErrors }));
        }

        // Reassign the validated data
        req.body = parsed.data.body || req.body;
        req.query = parsed.data.query || req.query;
        req.params = parsed.data.params || req.params;

        next();
    };
};

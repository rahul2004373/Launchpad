import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const IS_PROD = process.env.NODE_ENV === 'production';

export const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message    = err.message    || 'Internal Server Error';

    // Handle specific Prisma errors
    if (err.code === 'P2002') {
        statusCode = 409;
        message    = 'A record with that value already exists.';
    }

    if (err.code === 'P2025') {
        statusCode = 404;
        message    = 'Record not found.';
    }

    const meta = {
        statusCode,
        method:  req.method,
        path:    req.originalUrl,
        userId:  req.user?.id || null,
        err:     err.message,
        stack:   IS_PROD ? undefined : err.stack,
    };

    // Operational errors (AppError) are expected — warn level
    // Unexpected errors are bugs — error level
    if (err instanceof AppError) {
        if (statusCode >= 500) {
            logger.error(message, meta);
        } else {
            logger.warn(message, meta);
        }
    } else {
        logger.error('Unhandled exception', meta);
    }

    res.status(statusCode).json({
        success:    false,
        statusCode,
        message,
        ...(IS_PROD ? {} : { stack: err.stack }),
    });
};

/**
 * HTTP Request Logging Middleware
 *
 * Logs every incoming request and the final response.
 * Dev: lightweight one-liner with method, path, status, response time
 * Prod: structured JSON with full request context for New Relic
 */

import logger from '../utils/logger.js';

export const httpLogger = (req, res, next) => {
    const startAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;
        const statusCode = res.statusCode;

        const meta = {
            method:      req.method,
            path:        req.originalUrl,
            statusCode,
            durationMs:  Math.round(durationMs * 100) / 100,
            ip:          req.ip || req.socket?.remoteAddress,
            userAgent:   req.get('user-agent'),
            userId:      req.user?.id || null,
        };

        // Choose log level based on HTTP status code
        if (statusCode >= 500) {
            logger.error(`${req.method} ${req.originalUrl} ${statusCode}`, meta);
        } else if (statusCode >= 400) {
            logger.warn(`${req.method} ${req.originalUrl} ${statusCode}`, meta);
        } else {
            logger.info(`${req.method} ${req.originalUrl} ${statusCode}`, meta);
        }
    });

    next();
};

/**
 * BOOTSTRAP ORDER — DO NOT CHANGE:
 * 1. dotenv    — populates process.env from .env
 * 2. newrelic  — reads process.env for license key + app name, then instruments Node internals
 * 3. everything else
 *
 * New Relic must be the first module that does real work, but env vars must exist first.
 */
import 'dotenv/config';
import 'newrelic';

import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import logger from './src/utils/logger.js';

const PORT    = process.env.PORT    || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Process-level safety nets ─────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
    logger.fatal('Uncaught exception — process will exit', {
        err:   err.message,
        stack: err.stack,
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal('Unhandled promise rejection — process will exit', {
        reason: reason?.message || String(reason),
        stack:  reason?.stack,
    });
    process.exit(1);
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            logger.info('HTTP server listening', {
                port:        PORT,
                environment: NODE_ENV,
                pid:         process.pid,
            });
        });
    })
    .catch((err) => {
        logger.fatal('Database connection failed — process will exit', {
            err:   err.message,
            stack: err.stack,
        });
        process.exit(1);
    });

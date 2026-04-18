/**
 * Central Application Logger
 *
 * Environment-aware:
 *   - development: human-readable colorized output to console
 *   - production:  JSON structured logs for New Relic / log aggregators
 *
 * Log Levels (lowest → highest severity):
 *   debug < info < warn < error < fatal
 *
 * New Relic integration (production only):
 *   - @newrelic/winston-enricher adds trace.id + span.id to every log line
 *   - Enables "Logs in Context" — click a log to jump to its distributed trace
 *   - application_logging.forwarding in newrelic.js ships logs automatically
 *
 * Usage:
 *   import logger from './utils/logger.js';
 *   logger.info('Server started', { port: 8080 });
 *   logger.error('Database error', { err: err.message, stack: err.stack });
 *   logger.fatal('Unrecoverable failure', { reason: '...' });
 */

import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const { combine, timestamp, printf, colorize, json, errors, splat } = winston.format;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR   = path.resolve(__dirname, '../../logs');

const NODE_ENV  = process.env.NODE_ENV  || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const IS_PROD   = NODE_ENV === 'production';

// ── Custom levels — adds "fatal" above error ──────────────────────────────────
const CUSTOM_LEVELS = {
    levels: { fatal: 0, error: 1, warn: 2, info: 3, debug: 4 },
    colors: { fatal: 'magenta', error: 'red', warn: 'yellow', info: 'green', debug: 'cyan' },
};

winston.addColors(CUSTOM_LEVELS.colors);

// ── Formats ───────────────────────────────────────────────────────────────────

/**
 * Development: compact, colorized, human-readable.
 * Example: 2026-04-14 16:53:00 [info]  HTTP server listening {"port":8080}
 */
const DEV_FORMAT = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    printf(({ timestamp, level, message, stack, service, environment, ...meta }) => {
        const metaStr  = Object.keys(meta).length ? `  ${JSON.stringify(meta)}` : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `${timestamp} [${level}]  ${message}${metaStr}${stackStr}`;
    }),
);

/**
 * Production: structured JSON — New Relic compatible.
 * NR reads "message", "level", "timestamp" natively.
 * All extra fields become searchable log attributes in NR Logs.
 *
 * With @newrelic/winston-enricher loaded, NR also injects:
 *   trace.id, span.id, entity.name, entity.type — enabling "Logs in Context".
 */
const buildProdFormat = (nrEnricher) => {
    const formatters = [timestamp(), errors({ stack: true }), splat()];
    if (nrEnricher) formatters.push(nrEnricher);   // NR trace correlation
    formatters.push(json());
    return combine(...formatters);
};

// ── New Relic Winston enricher (production only) ──────────────────────────────
// Dynamically loaded so the app boots cleanly without NR in non-prod environments.
let nrEnricher = null;
if (IS_PROD) {
    try {
        const { default: newrelicFormatter } = await import('@newrelic/winston-enricher');
        nrEnricher = newrelicFormatter(winston);
    } catch {
        // NR enricher unavailable (CI, local dev in prod mode) — continue without it
    }
}

// ── Transports ────────────────────────────────────────────────────────────────
const transports = [];

if (IS_PROD) {
    const prodFmt = buildProdFormat(nrEnricher);

    // stdout — New Relic agent reads this via application_logging.forwarding
    transports.push(new winston.transports.Console({ format: prodFmt }));

    // Daily rotating file — 14-day retention, 20MB per file
    transports.push(new winston.transports.DailyRotateFile({
        dirname:     LOG_DIR,
        filename:    'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize:     '20m',
        maxFiles:    '14d',
        format:      prodFmt,
    }));

    // Separate errors-only file — 30-day retention for post-mortems
    transports.push(new winston.transports.DailyRotateFile({
        dirname:     LOG_DIR,
        filename:    'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level:       'error',
        maxSize:     '20m',
        maxFiles:    '30d',
        format:      prodFmt,
    }));
} else {
    // Development: colorized console only
    transports.push(new winston.transports.Console({ format: DEV_FORMAT }));
}

// ── Logger instance ───────────────────────────────────────────────────────────
const logger = winston.createLogger({
    levels:      CUSTOM_LEVELS.levels,
    level:       LOG_LEVEL,
    defaultMeta: { service: 'mini-vercel-api', environment: NODE_ENV },
    transports,
    exitOnError: false,
});

/**
 * logger.fatal(message, meta)
 * Logs at the highest severity level.
 * Used for unrecoverable errors that require process shutdown.
 */
logger.fatal = (message, meta = {}) => {
    logger.log('fatal', message, meta);
};

export default logger;

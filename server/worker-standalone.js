import 'dotenv/config';

/**
 * New Relic MUST be the very first library import after environment variables
 */
import 'newrelic';
import './src/config/db.js';
import './src/queues/deployment.worker.js';
import logger from './src/utils/logger.js';

logger.info('Build worker process started');

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const shutdown = (signal) => {
    logger.info(`Worker received ${signal} — shutting down gracefully`);
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

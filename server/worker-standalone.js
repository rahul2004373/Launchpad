import 'dotenv/config';

/**
 * New Relic MUST be the very first library import after environment variables
 */
import 'newrelic';
import http from 'http';
import './src/config/db.js';
import './src/queues/deployment.worker.js';
import logger from './src/utils/logger.js';

logger.info('Build worker process started');

// ── Dummy HTTP Server for Render Web Service Health Checks ──
const PORT = process.env.PORT || 8001;
const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', component: 'worker' }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    logger.info(`Worker health check HTTP server listening on port ${PORT}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const shutdown = (signal) => {
    logger.info(`Worker received ${signal} — shutting down gracefully`);
    server.close(() => {
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

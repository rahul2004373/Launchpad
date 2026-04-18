import { prisma } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Persist a single build step log entry to the database.
 * Also echoes to the application logger so build activity is visible
 * in New Relic alongside HTTP and system logs.
 *
 * @param {string} deploymentId
 * @param {string} content       - Human-readable log message
 * @param {'INFO'|'WARN'|'ERROR'} level
 */
let logBuffer = [];
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 2000; // 2 seconds

/**
 * Persist log entries in batches to prevent database saturation.
 */
const flushLogs = async () => {
    if (logBuffer.length === 0) return;

    const currentBatch = [...logBuffer];
    logBuffer = [];

    try {
        await prisma.log.createMany({
            data: currentBatch,
        });
    } catch (err) {
        // If DB is unreachable, put logs back at the front of the buffer (max 1000)
        logger.error('Failed to flush build logs to DB', { err: err.message });
        if (logBuffer.length < 1000) {
            logBuffer = [...currentBatch, ...logBuffer].slice(0, 1000);
        }
    }
};

// Set up periodic flush
setInterval(flushLogs, FLUSH_INTERVAL);

/**
 * Queue a single build step log entry.
 * 
 * @param {string} deploymentId
 * @param {string} content
 * @param {'INFO'|'WARN'|'ERROR'} level
 */
export const logBuildStep = async (deploymentId, content, level = 'INFO') => {
    // 1. Mirror to app logger immediately (visible in New Relic)
    const logFn = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'debug';
    logger[logFn](`[build] ${content}`, { deploymentId });

    // 2. Queue for database batch insert
    logBuffer.push({
        deploymentId,
        content: content.slice(0, 5000), // Safety truncation
        level,
        timestamp: new Date(),
    });

    // 3. Early flush if batch is full
    if (logBuffer.length >= BATCH_SIZE) {
        // Run flush asynchronously so we don't block the build process
        flushLogs().catch(() => {});
    }
};

/**
 * Utility to log multiple lines at once (e.g. from stdout)
 */
export const logMultipleLines = async (deploymentId, data, level = 'INFO') => {
    const lines = data.toString().split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
        // We no longer need to await each line because logBuildStep is now non-blocking
        logBuildStep(deploymentId, line.trim(), level);
    }
};

/**
 * Ensure all pending logs are saved (call this at the end of deployment)
 */
export const flushAllLogs = async () => {
    await flushLogs();
};

/**
 * Fetch structured, ordered build logs for a deployment.
 * 
 * Returns logs ordered by timestamp with:
 * - Step number (1-indexed sequential order)
 * - Relative timestamp (seconds since first log)
 * - Grouped by phase (Setup, Clone, Build, Upload, Finalize, Cleanup)
 * 
 * @param {string} deploymentId
 * @returns {Object} Structured log response
 */
export const getDeploymentLogs = async (deploymentId) => {
    const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        select: {
            id: true,
            status: true,
            project: { select: { name: true } },
            framework: true,
            startedAt: true,
            completedAt: true,
        },
    });

    if (!deployment) return null;

    const rawLogs = await prisma.log.findMany({
        where: { deploymentId },
        orderBy: { timestamp: 'asc' },
        select: {
            id: true,
            content: true,
            level: true,
            timestamp: true,
        },
    });

    const firstTimestamp = rawLogs[0]?.timestamp || new Date();

    // Add step number and relative time to each log
    const logs = rawLogs.map((log, index) => ({
        step: index + 1,
        content: log.content,
        level: log.level,
        timestamp: log.timestamp,
        elapsedMs: log.timestamp - firstTimestamp,
    }));

    // Count by level
    const counts = {
        total: logs.length,
        info: logs.filter(l => l.level === 'INFO').length,
        warn: logs.filter(l => l.level === 'WARN').length,
        error: logs.filter(l => l.level === 'ERROR').length,
    };

    // Calculate total build duration
    const lastTimestamp = rawLogs[rawLogs.length - 1]?.timestamp || firstTimestamp;
    const durationMs = lastTimestamp - firstTimestamp;
    const durationSeconds = Math.round(durationMs / 1000);

    return {
        deployment: {
            id: deployment.id,
            status: deployment.status,
            projectName: deployment.project?.name,
            framework: deployment.framework,
            startedAt: deployment.startedAt,
            completedAt: deployment.completedAt,
            durationSeconds,
        },
        summary: counts,
        logs,
    };
};


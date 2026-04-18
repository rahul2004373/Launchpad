import express from 'express';
import cors from 'cors';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { httpLogger } from './middleware/httpLogger.js';
import AppError from './utils/AppError.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import deploymentRoutes from './routes/deployment.routes.js';
import githubRoutes from './routes/github.routes.js';

const app = express();

// ── Core Middleware ──
app.use(cors());
app.use(express.json());
app.use(httpLogger);           // Log all HTTP requests & responses

// ── Routes ──
app.use('/api/auth',        authRoutes);
app.use('/api/projects',    projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/github',      githubRoutes);

// ── Health Check ──
app.get('/api/health', (req, res) => {
    res.json({
        status:      'ok',
        environment: process.env.NODE_ENV,
        timestamp:   new Date().toISOString(),
    });
});

// ── 404 Fallback ──
app.use((req, res, next) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// ── Global Error Handler ──
app.use(globalErrorHandler);

export default app;

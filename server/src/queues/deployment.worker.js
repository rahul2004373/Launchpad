import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import connection from '../config/redis.js';
import { prisma } from '../config/db.js';

import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { resolveFramework } from '../frameworks/index.js';
import { logBuildStep } from '../services/log.service.js';
import { buildInDocker } from '../services/docker.service.js';
import { uploadFolderToS3 } from '../services/s3.service.js';
import logger from '../utils/logger.js';

const TEMP_DIR = path.resolve('temp');
await fs.ensureDir(TEMP_DIR);

const worker = new Worker(
    'deployment-queue',
    async (job) => {
        const { deploymentId, repoUrl, rootDirectory = '', buildCommand } = job.data;
        const projectPath = path.join(TEMP_DIR, deploymentId);
        const buildCwd    = path.join(projectPath, rootDirectory);

        logger.info('Deployment job picked up', {
            deploymentId,
            jobId: job.id,
            repoUrl,
        });

        try {
            // ── Phase 1: Preparation ──
            await logBuildStep(deploymentId, '🚀 Initializing your deployment...');

            await prisma.deployment.update({
                where: { id: deploymentId },
                data:  { status: 'BUILDING', startedAt: new Date() },
            });

            const { installCommand, githubToken, outputDir } = job.data;
            let adapter;
            let pkg = null;

            // ── Phase 2: Cloning ──
            await logBuildStep(deploymentId, '📂 Preparing your code (cloning repository)...');
            await fs.remove(projectPath);
            
            const authRepoUrl = githubToken 
                ? repoUrl.replace('https://', `https://${githubToken}@`) 
                : repoUrl;

            try {
                await simpleGit().clone(authRepoUrl, projectPath, ['--depth', '1']);
                
                const files = await fs.readdir(projectPath);
                if (files.filter(f => !f.startsWith('.git')).length === 0) {
                    throw new Error('The repository appears to be empty.');
                }
            } catch (cloneErr) {
                throw new Error(`Could not access your repository: ${cloneErr.message}`);
            }

            // ── Phase 3: Framework Analysis ──
            await logBuildStep(deploymentId, '🔍 Analyzing your project structure...');
            const result = await resolveFramework(buildCwd);

            if (result) {
                adapter = result.adapter;
                pkg = result.pkg;
                await logBuildStep(deploymentId, `✨ Detected ${adapter.displayName} project.`);
            } else {
                // If detection fails, we strictly support only the two frameworks as requested.
                // However, for maximum flexibility, we'll default to Vite-style settings 
                // if the user provided a build command manually.
                const { ViteAdapter } = await import('../frameworks/vite.js');
                adapter = new ViteAdapter();
                await logBuildStep(deploymentId, '⚠️ Could not determine framework; proceeding with standard static build.');
            }

            const finalBuildCommand = buildCommand || adapter.buildCommand;
            const finalOutputDir = outputDir || adapter.outputDir;

            // ── Phase 4: Building ──
            await logBuildStep(deploymentId, '🏗️ Starting isolated build process...');

            const buildResult = await buildInDocker(deploymentId, {
                repoUrl,
                rootDirectory,
                buildCommand: finalBuildCommand,
                installCommand: installCommand || 'npm install',
                githubToken,
                adapter,
                // pkg is checked in Docker to decide on COPY vs CLONE logic, 
                // but we fixed it to always COPY in base.js now for consistency.
                pkg: pkg || {}, 
            });

            if (!buildResult.success) {
                throw new Error('Build failed. Check the logs above for errors.');
            }

            await logBuildStep(deploymentId, '✅ Build finished successfully.');

            // ── Phase 5: Deployment ──
            await logBuildStep(deploymentId, '☁️ Deploying to edge storage (S3)...');
            const s3Url = await uploadFolderToS3(buildResult.localPath, deploymentId);

            // ── Phase 6: Finalize ──
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status:        'READY',
                    deploymentUrl: s3Url,
                    framework:     adapter.name,
                    buildCommand:  finalBuildCommand,
                    outputDir:     finalOutputDir,
                    completedAt:   new Date(),
                },
            });

            await logBuildStep(deploymentId, `🎉 Great news! Your deployment is live: ${s3Url}`);

            // Cleanup
            await fs.remove(projectPath).catch(() => {});
            await job.updateProgress(100);
            return { success: true, url: s3Url };

        } catch (err) {
            await logBuildStep(deploymentId, `❌ Deployment failed: ${err.message}`, 'ERROR');
            
            const { flushAllLogs } = await import('../services/log.service.js');
            await flushAllLogs();

            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status:      'FAILED',
                    error:       err.message,
                    completedAt: new Date(),
                },
            });

            await fs.remove(projectPath).catch(() => {});
            throw err;
        }
    },
    {
        connection,
        concurrency: 2,
    },
);

worker.on('completed', (job) => {
    logger.info('Build job completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
    logger.error('Build job failed', { jobId: job?.id, err: err.message });
});

logger.info('Build worker started', { concurrency: 2 });

export default worker;
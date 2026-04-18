import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { logBuildStep, logMultipleLines } from './log.service.js';
import logger from '../utils/logger.js';

/**
 * Builds a project inside a Docker container using the framework adapter.
 *
 * @param {string} deploymentId
 * @param {Object} options
 * @param {string} options.repoUrl
 * @param {string} options.rootDirectory
 * @param {string} options.buildCommand
 * @param {import('../frameworks/base.js').BaseFrameworkAdapter} options.adapter
 * @param {Object} options.pkg - package.json contents
 * @returns {{ success: boolean, localPath: string }}
 */
export const buildInDocker = async (deploymentId, { rootDirectory, buildCommand, installCommand, githubToken, adapter }) => {
    const projectPath   = path.resolve('temp', deploymentId);
    await fs.ensureDir(projectPath);

    const dockerfileName = `Dockerfile.${deploymentId}`;
    const dockerfilePath = path.join(projectPath, dockerfileName);
    const imageName      = `build-${deploymentId.toLowerCase()}`;
    const containerName  = `container-${deploymentId.toLowerCase()}`;

    try {
        const dockerfileContent = adapter.generateDockerfile({
            rootDirectory,
            buildCommand,
            installCommand,
        });

        await fs.writeFile(dockerfilePath, dockerfileContent);

        // 2. Build the Docker image
        const buildArgs = ['build', '--no-cache', '-t', imageName, '-f', dockerfilePath];
        if (githubToken) {
            buildArgs.push('--build-arg', `GITHUB_TOKEN=${githubToken}`);
        }
        buildArgs.push(projectPath);

        await runDockerCommand(buildArgs, deploymentId);

        // 3. Extract build artifacts from the container
        await runDockerCommand(['create', '--name', containerName, imageName], deploymentId);

        const localDest = path.join(projectPath, 'output');
        await fs.ensureDir(localDest);

        await runDockerCommand(['cp', `${containerName}:/app/output/.`, localDest], deploymentId);

        // 4. Validate output
        const validation = await adapter.validate(localDest);
        if (!validation.valid) {
            throw new Error(validation.warnings.join(', '));
        }

        return { success: true, localPath: localDest };

    } finally {
        try {
            await runDockerCommand(['rm', '-f', containerName], deploymentId, true);
            await runDockerCommand(['rmi', '-f', imageName],   deploymentId, true);
            await fs.remove(dockerfilePath).catch(() => {});
        } catch (cleanupErr) {
            logger.warn('Cleanup failed', { deploymentId, err: cleanupErr.message });
        }
    }
};

/**
 * Execute a Docker CLI command and stream stdout/stderr to build logs.
 *
 * @param {string[]} args - Docker CLI arguments
 * @param {string}   deploymentId
 * @param {boolean}  silent - suppress output (used for cleanup commands)
 */
const runDockerCommand = (args, deploymentId, silent = false) => {
    return new Promise((resolve, reject) => {
        // Removing shell: true prevents shell-injection/escaping issues with spaces 
        // especially on Windows when passing array of arguments.
        const child = spawn('docker', args, { shell: false });

        child.stdout.on('data', (data) => {
            if (!silent) logMultipleLines(deploymentId, data, 'INFO');
        });

        child.stderr.on('data', (data) => {
            if (!silent) logMultipleLines(deploymentId, data, 'INFO');
        });

        child.on('close', (code) => {
            if (code === 0 || silent) {
                resolve();
            } else {
                reject(new Error(`Docker command failed [${code}]: docker ${args.join(' ')}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Failed to spawn Docker process: ${err.message}`));
        });
    });
};

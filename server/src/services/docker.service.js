import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { logBuildStep, logMultipleLines } from './log.service.js';
import logger from '../utils/logger.js';

/**
 * Check if the Docker CLI is available on the system.
 */
const checkDockerAvailable = () => {
    return new Promise((resolve, reject) => {
        const child = spawn('docker', ['--version'], { shell: false });
        child.on('error', (err) => {
            reject(err);
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error('Docker CLI exited with non-zero code'));
            }
        });
    });
};

/**
 * Execute a local shell command and stream stdout/stderr to build logs.
 */
const runLocalCommand = (commandString, cwd, deploymentId, env = {}) => {
    return new Promise((resolve, reject) => {
        const child = spawn(commandString, {
            shell: true,
            cwd,
            env: { ...process.env, ...env, CI: 'true' }
        });

        child.stdout.on('data', (data) => {
            logMultipleLines(deploymentId, data, 'INFO');
        });

        child.stderr.on('data', (data) => {
            logMultipleLines(deploymentId, data, 'INFO');
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code [${code}]: ${commandString}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Failed to start command: ${err.message}`));
        });
    });
};

/**
 * Fallback builder that executes npm install / npm run build locally when Docker is unavailable.
 */
const buildLocally = async (deploymentId, { rootDirectory, buildCommand, installCommand, adapter, env = {} }) => {
    const projectPath = path.resolve('temp', deploymentId);
    const buildCwd = path.join(projectPath, rootDirectory || '');
    
    await logBuildStep(deploymentId, '⚠️ Docker not detected in environment. Falling back to local Node.js builder...');
    
    try {
        // 1. Run install command
        const finalInstallCommand = installCommand !== undefined && installCommand !== null ? installCommand : adapter.installCommand;
        if (finalInstallCommand) {
            await logBuildStep(deploymentId, `📦 Installing dependencies with: ${finalInstallCommand}`);
            await runLocalCommand(finalInstallCommand, buildCwd, deploymentId, env);
        }
        
        // 2. Run build command
        const finalBuildCommand = buildCommand !== undefined && buildCommand !== null ? buildCommand : adapter.buildCommand;
        if (finalBuildCommand) {
            await logBuildStep(deploymentId, `🏗️ Building project with: ${finalBuildCommand}`);
            await runLocalCommand(finalBuildCommand, buildCwd, deploymentId, env);
        }
        
        // 3. Move output files to output folder
        const rawOutputDir = adapter.outputDir || 'dist';
        const outputSource = path.join(buildCwd, rawOutputDir);
        const localDest = path.join(projectPath, 'output');
        
        await fs.ensureDir(localDest);
        
        if (await fs.pathExists(outputSource)) {
            await fs.copy(outputSource, localDest);
        } else {
            // Fallback: try common output dirs if the specified one doesn't exist
            const fallbacks = ['dist', 'build', 'out', 'public'];
            let copied = false;
            for (const fb of fallbacks) {
                const fbPath = path.join(buildCwd, fb);
                if (await fs.pathExists(fbPath)) {
                    await logBuildStep(deploymentId, `Found output in fallback directory: ${fb}`);
                    await fs.copy(fbPath, localDest);
                    copied = true;
                    break;
                }
            }
            if (!copied) {
                throw new Error(`Build output folder not found. Expected output directory: ${rawOutputDir}`);
            }
        }
        
        // 4. Validate output
        const validation = await adapter.validate(localDest);
        if (!validation.valid) {
            throw new Error(validation.warnings.join(', '));
        }
        
        return { success: true, localPath: localDest };
    } catch (err) {
        throw new Error(`Local build failed: ${err.message}`);
    }
};

/**
 * Builds a project inside a Docker container using the framework adapter,
 * with a fallback to local build if Docker is not installed in the runtime environment.
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
export const buildInDocker = async (deploymentId, { rootDirectory, buildCommand, installCommand, githubToken, adapter, env = {} }) => {
    try {
        await checkDockerAvailable();
    } catch (err) {
        // Docker is missing (e.g. Render runtime) — fallback to local build
        return buildLocally(deploymentId, { rootDirectory, buildCommand, installCommand, adapter, env });
    }

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
            env,
        });

        await fs.writeFile(dockerfilePath, dockerfileContent);

        // 2. Build the Docker image
        const buildArgs = ['build', '--no-cache', '--progress=plain', '-t', imageName, '-f', dockerfilePath];
        
        // Add custom environment variables as build args
        Object.entries(env).forEach(([key, value]) => {
            buildArgs.push('--build-arg', `${key}=${value}`);
        });

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

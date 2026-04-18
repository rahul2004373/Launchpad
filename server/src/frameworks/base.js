/**
 * Base Framework Adapter
 * 
 * Every framework adapter must extend this interface.
 * To add a new framework, create a new file in /frameworks/ and register it in index.js.
 */
export class BaseFrameworkAdapter {
    /** @returns {string} Framework identifier (e.g., 'cra', 'vite') */
    get name() { throw new Error('Not implemented'); }

    /** @returns {string} Human-readable display name */
    get displayName() { throw new Error('Not implemented'); }

    /** @returns {string} Default build command */
    get buildCommand() { return 'npm run build'; }

    /** @returns {string} Default output directory after build */
    get outputDir() { throw new Error('Not implemented'); }

    /**
     * Check if a project belongs to this framework based on dependency analysis.
     */
    detect(deps, pkg) { throw new Error('Not implemented'); }

    /**
     * Generate Dockerfile content for this framework.
     */
    generateDockerfile({ rootDirectory, buildCommand, installCommand }) {
        const normalizedRoot = (rootDirectory || '').replace(/\\/g, '/').replace(/^\/|\/$/g, '');
        const workDir = normalizedRoot ? `/app/${normalizedRoot}` : '/app';
        const artifactSrc = normalizedRoot
            ? `/app/${normalizedRoot}/${this.outputDir}`
            : `/app/${this.outputDir}`;

        // Robust Patching via Base64 Helper Script
        const patchContent = `
const fs = require('fs');
// 1. Patch package.json (CRA + Generic)
if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.homepage = '.';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
}
// 2. Patch Vite config
const viteFiles = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'];
const viteFile = viteFiles.find(f => fs.existsSync(f));
if (viteFile) {
    let content = fs.readFileSync(viteFile, 'utf8');
    if (!content.includes('base:')) {
        content = content.replace(/defineConfig\\s*\\(\\s*{/, "defineConfig({\\n  base: './',");
    } else {
        content = content.replace(/base:\\s*['"].*?['"]/, "base: './'");
    }
    fs.writeFileSync(viteFile, content);
}
        `.trim();

        const b64Patch = Buffer.from(patchContent).toString('base64');

        return `
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY . .
WORKDIR ${workDir}
ENV PUBLIC_URL=.
ENV VITE_BASE=./
RUN echo "${b64Patch}" | base64 -d > patch-all.cjs && node patch-all.cjs && rm patch-all.cjs
RUN ${installCommand || 'npm install'}
RUN ${buildCommand || this.buildCommand}

FROM alpine
WORKDIR /app
COPY --from=builder ${artifactSrc} ./output
        `.trim();
    }

    /**
     * Validate extracted build artifacts.
     */
    async validate(outputPath) {
        const { default: fs } = await import('fs-extra');
        const path = await import('path');
        const indexPath = path.join(outputPath, 'index.html');

        if (!await fs.pathExists(outputPath)) {
            return { valid: false, warnings: [`Output folder not found at ${outputPath}`] };
        }
        const hasIndex = await fs.pathExists(indexPath);
        return { valid: true, warnings: hasIndex ? [] : ['index.html missing'] };
    }
}

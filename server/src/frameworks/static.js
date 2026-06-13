import { BaseFrameworkAdapter } from './base.js';

/**
 * Static HTML/JS/CSS Adapter
 */
export class StaticAdapter extends BaseFrameworkAdapter {
    get name() { return 'static'; }
    get displayName() { return 'Static HTML/JS/CSS'; }
    get buildCommand() { return ''; }
    get installCommand() { return ''; }
    get outputDir() { return '.'; }

    detect(deps, pkg) {
        // Fallback detection (checked if Vite and CRA adapters fail)
        return true;
    }

    /**
     * Generate Dockerfile content for Static framework.
     */
    generateDockerfile({
        rootDirectory,
        buildCommand,
        installCommand,
        env = {},
    }) {
        const normalizedRoot = (rootDirectory || "")
          .replace(/\\/g, "/")
          .replace(/^\/|\/$/g, "");
        const workDir = normalizedRoot ? `/app/${normalizedRoot}` : "/app";

        // Generate ARG and ENV lines for custom environment variables
        const envLines = Object.keys(env)
          .map((key) => `ARG ${key}\nENV ${key}=$${key}`)
          .join("\n");

        // Optional custom build/install steps (only run if provided)
        const installStep = installCommand ? `RUN ${installCommand}` : "";
        const buildStep = buildCommand ? `RUN ${buildCommand}` : "";
        const outputFolder = this.outputDir || ".";

        return `
FROM node:20-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY . .
WORKDIR ${workDir}
${envLines}
${installStep}
${buildStep}
RUN mkdir -p /static_output && cp -R ${workDir}/${outputFolder}/. /static_output/ && rm -rf /static_output/.git /static_output/.github /static_output/node_modules || true

FROM alpine
WORKDIR /app
COPY --from=builder /static_output ./output
        `.trim();
    }
}

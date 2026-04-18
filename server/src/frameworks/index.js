/**
 * Framework Registry
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │  HOW TO ADD A NEW FRAMEWORK:                            │
 * │  1. Create a new file in /frameworks/ (e.g. angular.js) │
 * │  2. Extend BaseFrameworkAdapter                         │
 * │  3. Import and push it into the `adapters` array below  │
 * │  That's it. No other files need changing.               │
 * └─────────────────────────────────────────────────────────┘
 */
import fs from 'fs-extra';
import path from 'path';
import { CRAAdapter } from './cra.js';
import { ViteAdapter } from './vite.js';

// ── Register only supported adapters ──
const adapters = [
    new CRAAdapter(),
    new ViteAdapter(),
];

/**
 * Detect which framework a project uses and return its adapter
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<{ adapter: BaseFrameworkAdapter, pkg: Object } | null>}
 */
export const resolveFramework = async (projectPath) => {
    const pkgPath = path.join(projectPath, 'package.json');

    if (!await fs.pathExists(pkgPath)) {
        return null;
    }

    const pkg = await fs.readJson(pkgPath);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const adapter of adapters) {
        if (adapter.detect(deps, pkg)) {
            return { adapter, pkg };
        }
    }

    return null; // Unknown framework
};

/**
 * Get an adapter by name (useful when framework is already known)
 * @param {string} name - Framework name (e.g. 'cra', 'vite')
 * @returns {BaseFrameworkAdapter | undefined}
 */
export const getAdapterByName = (name) => {
    return adapters.find(a => a.name === name);
};

import fs from "fs-extra";
import path from "path";
import { CRAAdapter } from "./cra.js";
import { ViteAdapter } from "./vite.js";
import { StaticAdapter } from "./static.js";

// ── Register only supported adapters ──
const adapters = [new CRAAdapter(), new ViteAdapter(), new StaticAdapter()];

/**
 * Detect which framework a project uses and return its adapter
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<{ adapter: BaseFrameworkAdapter, pkg: Object } | null>}
 */
export const resolveFramework = async (projectPath) => {
  const pkgPath = path.join(projectPath, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    return { adapter: new StaticAdapter(), pkg: {} };
  }

  const pkg = await fs.readJson(pkgPath);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const adapter of adapters) {
    if (adapter.name !== "static" && adapter.detect(deps, pkg)) {
      return { adapter, pkg };
    }
  }

  return { adapter: new StaticAdapter(), pkg };
};

/**
 * Get an adapter by name (useful when framework is already known)
 * @param {string} name - Framework name (e.g. 'cra', 'vite')
 * @returns {BaseFrameworkAdapter | undefined}
 */
export const getAdapterByName = (name) => {
  return adapters.find((a) => a.name === name);
};

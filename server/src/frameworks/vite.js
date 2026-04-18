import { BaseFrameworkAdapter } from './base.js';

/**
 * Vite Adapter
 */
export class ViteAdapter extends BaseFrameworkAdapter {
    get name() { return 'vite'; }
    get displayName() { return 'Vite'; }
    get buildCommand() { return 'npm run build'; }
    get outputDir() { return 'dist'; }

    detect(deps) {
        return !!deps['vite'];
    }
}

import { BaseFrameworkAdapter } from './base.js';

/**
 * Create React App Adapter
 */
export class CRAAdapter extends BaseFrameworkAdapter {
    get name() { return 'cra'; }
    get displayName() { return 'Create React App'; }
    get buildCommand() { return 'npm run build'; }
    get outputDir() { return 'build'; }

    detect(deps) {
        return !!deps['react-scripts'];
    }
}

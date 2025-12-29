import { createRollupConfig } from '../../rollup.config.base.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const configs = createRollupConfig(__dirname);

// Add React externals
export default configs.map((config) => ({
  ...config,
  external: [...(Array.isArray(config.external) ? config.external : []), 'react', 'react-dom', 'react/jsx-runtime'],
}));

import { createRollupConfig } from '../../rollup.config.base.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default createRollupConfig(__dirname);

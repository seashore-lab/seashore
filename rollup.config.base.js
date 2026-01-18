import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Creates Rollup configuration for a package
 * @param {string} packageDir - Absolute path to package directory
 */
export function createRollupConfig(packageDir) {
  const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'));
  const packageName = pkg.name.replace('@seashorelab/', '');

  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    /^@seashorelab\//,
    /^node:/,
  ];

  return [
    // ESM build
    {
      input: resolve(packageDir, 'src/index.ts'),
      output: {
        file: resolve(packageDir, 'dist/index.js'),
        format: 'esm',
        sourcemap: true,
      },
      external,
      plugins: [
        typescript({
          tsconfig: resolve(packageDir, 'tsconfig.build.json'),
          declaration: false,
        }),
      ],
    },
    // Type declarations
    {
      input: resolve(packageDir, 'src/index.ts'),
      output: {
        file: resolve(packageDir, 'dist/index.d.ts'),
        format: 'esm',
      },
      external,
      plugins: [dts()],
    },
  ];
}

export default createRollupConfig;

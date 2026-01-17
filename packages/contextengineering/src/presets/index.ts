/**
 * @seashore/contextengineering - Presets
 *
 * Pre-built context blocks for common use cases
 */

export { identity } from './identity';
export { timeAwareness } from './time-awareness';
export { safetyGuidelines } from './safety';
export { codeGeneration } from './code-generation';
export { outputConstraints } from './output-constraints';

// Re-export all presets as a namespace
import { identity } from './identity';
import { timeAwareness } from './time-awareness';
import { safetyGuidelines } from './safety';
import { codeGeneration } from './code-generation';
import { outputConstraints } from './output-constraints';

/**
 * All presets as a single object for convenient access
 *
 * @example
 * ```typescript
 * import { presets } from '@seashore/contextengineering'
 *
 * const context = createContext({
 *   blocks: [
 *     presets.identity({ name: 'Bot', role: 'assistant' }),
 *     presets.timeAwareness(),
 *     presets.safetyGuidelines(),
 *   ],
 * })
 * ```
 */
export const presets = {
  identity,
  timeAwareness,
  safetyGuidelines,
  codeGeneration,
  outputConstraints,
};

/**
 * @seashorelab/contextengineering - Identity Preset
 *
 * Preset block for agent identity configuration
 */

import type { ContextBlock, IdentityPresetOptions } from '../types';

/**
 * Create an identity preset block
 *
 * @example
 * ```typescript
 * const identityBlock = identity({
 *   name: 'Assistant',
 *   role: 'helpful AI assistant',
 *   personality: ['professional', 'friendly'],
 * })
 * ```
 */
export function identity(options: IdentityPresetOptions): ContextBlock {
  const { name, role, personality, title, isStatic = true } = options;

  return {
    type: 'preset:identity',
    priority: 10,
    isStatic,

    async render(): Promise<string> {
      const lines: string[] = [];

      lines.push(`## ${title || 'Identity'}`);
      lines.push('');
      lines.push(`You are **${name}**${role ? `, a ${role}` : ''}.`);

      if (personality && personality.length > 0) {
        lines.push('');
        lines.push('**Your personality traits:**');
        personality.forEach((trait) => {
          lines.push(`- ${trait}`);
        });
      }

      return lines.join('\n');
    },
  };
}

/**
 * @seashore/contextengineering - Code Generation Preset
 *
 * Preset block for code generation tasks
 */

import type { ContextBlock, CodeGenerationPresetOptions } from '../types';

/**
 * Create a code generation preset block
 *
 * @example
 * ```typescript
 * const codeBlock = codeGeneration({
 *   languages: ['typescript', 'python'],
 *   style: 'documented',
 *   includeTests: true,
 * })
 * ```
 */
export function codeGeneration(options: CodeGenerationPresetOptions = {}): ContextBlock {
  const { languages, style = 'clean', includeTests = false, title, isStatic = true } = options;

  return {
    type: 'preset:code-generation',
    priority: 40,
    isStatic,

    async render(): Promise<string> {
      const lines: string[] = [];

      lines.push(`## ${title || 'Code Generation Guidelines'}`);
      lines.push('');

      if (languages && languages.length > 0) {
        lines.push(`**Target Languages:** ${languages.join(', ')}`);
        lines.push('');
      }

      lines.push('**Code Style:**');
      switch (style) {
        case 'documented':
          lines.push('- Write comprehensive documentation and comments');
          lines.push('- Include JSDoc/docstrings for all public functions');
          lines.push('- Explain complex logic with inline comments');
          lines.push('- Add type annotations where applicable');
          break;
        case 'minimal':
          lines.push('- Write concise, minimal code');
          lines.push('- Avoid unnecessary comments');
          lines.push('- Focus on functionality over documentation');
          break;
        case 'clean':
        default:
          lines.push('- Write clean, readable code');
          lines.push('- Use meaningful variable and function names');
          lines.push('- Follow language-specific best practices');
          lines.push('- Add comments only where necessary for clarity');
      }

      if (includeTests) {
        lines.push('');
        lines.push('**Testing:**');
        lines.push('- Include unit tests for new functionality');
        lines.push('- Cover edge cases and error scenarios');
        lines.push('- Use appropriate testing frameworks');
      }

      lines.push('');
      lines.push('**General Guidelines:**');
      lines.push('- Handle errors appropriately');
      lines.push('- Consider security implications');
      lines.push('- Optimize for readability first, then performance');
      lines.push('- Use modern language features when appropriate');

      return lines.join('\n');
    },
  };
}

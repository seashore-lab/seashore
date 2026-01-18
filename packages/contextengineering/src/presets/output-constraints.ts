/**
 * @seashorelab/contextengineering - Output Constraints Preset
 *
 * Preset block for output format constraints
 */

import type { ContextBlock, OutputConstraintsPresetOptions } from '../types';

/**
 * Create an output constraints preset block
 *
 * @example
 * ```typescript
 * const outputBlock = outputConstraints({
 *   maxLength: 1000,
 *   format: 'markdown',
 *   language: 'English',
 *   tone: 'professional',
 * })
 * ```
 */
export function outputConstraints(options: OutputConstraintsPresetOptions = {}): ContextBlock {
  const { maxLength, format, language, tone, title, isStatic = true } = options;

  return {
    type: 'preset:output-constraints',
    priority: 85,
    isStatic,

    async render(): Promise<string> {
      const lines: string[] = [];

      lines.push(`## ${title || 'Output Requirements'}`);
      lines.push('');

      if (format) {
        const formatDescriptions: Record<string, string> = {
          markdown: 'Use Markdown formatting for structure and emphasis',
          plain: 'Use plain text without special formatting',
          json: 'Return responses in valid JSON format',
          xml: 'Return responses in valid XML format',
        };
        lines.push(`- **Format**: ${formatDescriptions[format] || format}`);
      }

      if (language) {
        lines.push(`- **Language**: Respond in ${language}`);
      }

      if (tone) {
        const toneDescriptions: Record<string, string> = {
          professional: 'Maintain a professional and business-appropriate tone',
          casual: 'Use a casual, conversational tone',
          friendly: 'Be warm, approachable, and friendly',
          formal: 'Use formal language and structure',
        };
        lines.push(`- **Tone**: ${toneDescriptions[tone] || tone}`);
      }

      if (maxLength) {
        lines.push(`- **Length**: Keep responses under ${maxLength} characters when possible`);
      }

      return lines.join('\n');
    },
  };
}

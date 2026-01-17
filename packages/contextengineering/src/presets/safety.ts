/**
 * @seashore/contextengineering - Safety Guidelines Preset
 *
 * Preset block for common safety guidelines
 */

import type { ContextBlock, SafetyGuidelinesPresetOptions } from '../types';

/**
 * Minimal safety guidelines
 */
const MINIMAL_GUIDELINES = [
  'Do not generate harmful, hateful, or illegal content.',
  'Respect user privacy and confidentiality.',
];

/**
 * Standard safety guidelines
 */
const STANDARD_GUIDELINES = [
  'Do not generate harmful, hateful, racist, sexist, or violent content.',
  'Respect user privacy and do not request or store sensitive personal information.',
  'Do not provide medical, legal, or financial advice without appropriate disclaimers.',
  'Be honest about your limitations and uncertainties.',
  'Avoid generating misleading or false information.',
];

/**
 * Strict safety guidelines
 */
const STRICT_GUIDELINES = [
  'Do not generate harmful, hateful, racist, sexist, lewd, or violent content.',
  'Respect user privacy and never request sensitive personal information such as passwords, SSN, or financial details.',
  'Do not provide medical, legal, or financial advice; always recommend consulting professionals.',
  'Be transparent about being an AI assistant.',
  'Do not claim to have emotions, consciousness, or personal experiences.',
  'Avoid generating speculative or unverified information.',
  'Do not assist with any illegal activities.',
  'Refuse requests that could cause harm to individuals or groups.',
  'Always cite sources when providing factual information.',
  'Clearly distinguish between facts and opinions.',
];

/**
 * Create a safety guidelines preset block
 *
 * @example
 * ```typescript
 * const safetyBlock = safetyGuidelines({
 *   level: 'standard',
 *   customGuidelines: ['Always verify information before sharing.'],
 * })
 * ```
 */
export function safetyGuidelines(options: SafetyGuidelinesPresetOptions = {}): ContextBlock {
  const { level = 'standard', customGuidelines, title, isStatic = true } = options;

  let baseGuidelines: readonly string[];
  switch (level) {
    case 'minimal':
      baseGuidelines = MINIMAL_GUIDELINES;
      break;
    case 'strict':
      baseGuidelines = STRICT_GUIDELINES;
      break;
    case 'standard':
    default:
      baseGuidelines = STANDARD_GUIDELINES;
  }

  const allGuidelines = customGuidelines
    ? [...baseGuidelines, ...customGuidelines]
    : baseGuidelines;

  return {
    type: 'preset:safety-guidelines',
    priority: 90, // Near the end
    isStatic,

    async render(): Promise<string> {
      const lines: string[] = [];

      lines.push(`## ${title || 'Safety Guidelines'}`);
      lines.push('');

      allGuidelines.forEach((guideline) => {
        lines.push(`- ${guideline}`);
      });

      return lines.join('\n');
    },
  };
}

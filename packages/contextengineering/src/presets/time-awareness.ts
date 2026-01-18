/**
 * @seashorelab/contextengineering - Time Awareness Preset
 *
 * Preset block for making LLMs aware of current time/date
 */

import type { ContextBlock, TimeAwarenessPresetOptions } from '../types';
import { createEnvironmentProvider } from '../providers/environment';

/**
 * Create a time awareness preset block
 *
 * This is the most important preset for solving the common problem
 * of LLMs not knowing the current time/date.
 *
 * @example
 * ```typescript
 * const timeBlock = timeAwareness({
 *   locale: 'en-US',
 *   includeDate: true,
 *   includeTime: true,
 *   includeTimezone: true,
 *   includeWeekday: true,
 * })
 * ```
 */
export function timeAwareness(options: TimeAwarenessPresetOptions = {}): ContextBlock {
  const {
    locale,
    includeDate = true,
    includeTime = true,
    includeTimezone = true,
    includeWeekday = true,
    title,
    isStatic = false, // Time is always dynamic
  } = options;

  return {
    type: 'preset:time-awareness',
    priority: 15,
    isStatic,

    async render(): Promise<string> {
      const provider = createEnvironmentProvider({
        currentDate: includeDate,
        currentTime: includeTime,
        currentDateTime: true,
        timezone: includeTimezone,
        weekday: includeWeekday,
        locale,
      });

      const context = await provider.getContext();
      const lines: string[] = [];

      lines.push(`## ${title || 'Current Date and Time'}`);
      lines.push('');

      if (context.currentDateTime) {
        lines.push(`- **Date & Time**: ${context.currentDateTime}`);
      }

      if (includeDate && context.currentDate) {
        lines.push(`- **Date**: ${context.currentDate}`);
      }

      if (includeTime && context.currentTime) {
        lines.push(`- **Time**: ${context.currentTime}`);
      }

      if (includeWeekday && context.weekday) {
        lines.push(`- **Day**: ${context.weekday}`);
      }

      if (includeTimezone && context.timezone) {
        lines.push(`- **Timezone**: ${context.timezone}`);
      }

      lines.push('');
      lines.push(
        '*Use this information when answering questions about time, dates, or scheduling.*'
      );

      return lines.join('\n');
    },
  };
}

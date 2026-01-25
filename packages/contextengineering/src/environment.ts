/**
 * @seashorelab/contextengineering - Environment Provider
 *
 * Provides runtime environment information (time, date, timezone, etc.)
 */

import type {
  EnvironmentOptions,
  EnvironmentContext,
  EnvironmentProvider,
  FormatOptions,
} from './types';

/**
 * Default environment options
 */
const DEFAULT_OPTIONS: EnvironmentOptions = {
  currentDateTime: true,
  timezone: true,
};

/**
 * Get current timezone name
 */
function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Get UTC offset string (e.g., "+08:00")
 */
function getUtcOffset(date: Date = new Date()): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

/**
 * Format datetime in ISO 8601 format with timezone
 */
function formatDateTime(date: Date): string {
  const offset = getUtcOffset(date);
  const isoString = date.toISOString();
  // Replace Z with actual offset
  return isoString.replace('Z', '').split('.')[0] + offset;
}

/**
 * Get weekday name
 */
function formatWeekday(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale || undefined, { weekday: 'long' });
}

/**
 * Create an environment provider
 *
 * @example
 * ```typescript
 * const env = createEnvironmentProvider({
 *   currentDateTime: true,
 *   timezone: true,
 *   locale: 'en-US',
 * })
 *
 * const context = await env.getContext()
 * // { currentDateTime: "2026-01-17T14:30:00+08:00", timezone: "Asia/Shanghai", locale: "en-US" }
 *
 * const formatted = await env.format()
 * // "## Current Environment\n- Date & Time: 2026-01-17T14:30:00+08:00\n- Timezone: Asia/Shanghai"
 * ```
 */
export function createEnvironmentProvider(
  options: EnvironmentOptions = DEFAULT_OPTIONS
): EnvironmentProvider {
  return {
    async getContext(): Promise<EnvironmentContext> {
      const now = new Date();
      const context: Record<string, string | undefined> = {};

      if (options.currentDateTime) {
        context.currentDateTime = formatDateTime(now);
      }

      if (options.timezone) {
        context.timezone = getTimezone();
      }

      if (options.weekday) {
        context.weekday = formatWeekday(now, options.locale);
      }

      if (options.locale) {
        context.locale = options.locale;
      }

      // Process custom variables
      if (options.custom) {
        for (const [key, value] of Object.entries(options.custom)) {
          if (typeof value === 'function') {
            context[key] = await value();
          } else {
            context[key] = value;
          }
        }
      }

      return context as EnvironmentContext;
    },

    async format(formatOptions?: FormatOptions): Promise<string> {
      const context = await this.getContext();
      const style = formatOptions?.style || 'markdown';
      const title = formatOptions?.title || 'Current Environment';

      // Filter keys
      let keys = Object.keys(context).filter((k) => context[k] !== undefined);
      if (formatOptions?.include) {
        keys = keys.filter((k) => formatOptions.include!.includes(k));
      }
      if (formatOptions?.exclude) {
        keys = keys.filter((k) => !formatOptions.exclude!.includes(k));
      }

      // Format key names for display
      const formatKey = (key: string): string => {
        // Convert camelCase to Title Case
        return key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
      };

      switch (style) {
        case 'yaml':
          return `# ${title}\n` + keys.map((k) => `${k}: ${JSON.stringify(context[k])}`).join('\n');

        case 'xml':
          return (
            `<environment>\n` +
            keys.map((k) => `  <${k}>${context[k]}</${k}>`).join('\n') +
            `\n</environment>`
          );

        case 'plain':
          return keys.map((k) => `${formatKey(k)}: ${context[k]}`).join('\n');

        case 'markdown':
        default:
          return `## ${title}\n` + keys.map((k) => `- ${formatKey(k)}: ${context[k]}`).join('\n');
      }
    },
  };
}

/**
 * Shorthand for creating and formatting environment context
 *
 * @example
 * ```typescript
 * const envString = await env({ currentDateTime: true, timezone: true })
 * // "## Current Environment\n- Current Date Time: 2026-01-17T14:30:00+08:00\n- Timezone: Asia/Shanghai"
 * ```
 */
export async function env(
  options: EnvironmentOptions = DEFAULT_OPTIONS,
  formatOptions?: FormatOptions
): Promise<string> {
  const provider = createEnvironmentProvider(options);
  return provider.format(formatOptions);
}

/**
 * Synchronous version that returns a provider (for use in context builders)
 */
export function createEnv(options: EnvironmentOptions = DEFAULT_OPTIONS): EnvironmentProvider {
  return createEnvironmentProvider(options);
}

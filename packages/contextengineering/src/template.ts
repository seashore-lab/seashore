/**
 * @seashorelab/contextengineering - Template
 *
 * Template system for variable interpolation in prompts
 */

import type { Template, TemplateOptions } from './types';

/**
 * Default template options
 */
const DEFAULT_OPTIONS: TemplateOptions = {
  openDelimiter: '{{',
  closeDelimiter: '}}',
  strict: false,
  defaultValue: '',
};

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Format value for template output
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatValue).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Create a template for variable interpolation
 *
 * @example
 * ```typescript
 * const template = createTemplate(`
 *   Hello {{name}}! Today is {{date}}.
 *   Your settings: {{settings.theme}}
 * `)
 *
 * const result = await template.render({
 *   name: 'World',
 *   date: '2026-01-17',
 *   settings: { theme: 'dark' },
 * })
 * // "Hello World! Today is 2026-01-17.\nYour settings: dark"
 * ```
 */
export function createTemplate(templateString: string, options?: TemplateOptions): Template {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { openDelimiter, closeDelimiter, strict, defaultValue } = opts;

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const open = escapeRegex(openDelimiter!);
  const close = escapeRegex(closeDelimiter!);

  // Match patterns like {{variable}} or {{object.property}}
  const variablePattern = new RegExp(`${open}\\s*([\\w.]+)\\s*${close}`, 'g');

  return {
    raw: templateString,

    async render(variables: Record<string, unknown>): Promise<string> {
      return templateString.replace(variablePattern, (_match, varPath: string) => {
        const value = getNestedValue(variables, varPath);

        if (value === undefined) {
          if (strict) {
            throw new Error(`Template variable "${varPath}" not found`);
          }
          return defaultValue!;
        }

        return formatValue(value);
      });
    },

    getVariables(): string[] {
      const variables: string[] = [];
      let match;

      // Reset regex state
      variablePattern.lastIndex = 0;

      while ((match = variablePattern.exec(templateString)) !== null) {
        const varPath = match[1];
        if (varPath && !variables.includes(varPath)) {
          variables.push(varPath);
        }
      }

      return variables;
    },
  };
}

/**
 * Render a template string directly with variables
 *
 * @example
 * ```typescript
 * const result = await renderTemplate(
 *   'Hello {{name}}!',
 *   { name: 'World' }
 * )
 * // "Hello World!"
 * ```
 */
export async function renderTemplate(
  templateString: string,
  variables: Record<string, unknown>,
  options?: TemplateOptions
): Promise<string> {
  const template = createTemplate(templateString, options);
  return template.render(variables);
}

/**
 * Check if a string contains template variables
 */
export function hasTemplateVariables(
  str: string,
  openDelimiter = '{{',
  closeDelimiter = '}}'
): boolean {
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `${escapeRegex(openDelimiter)}\\s*[\\w.]+\\s*${escapeRegex(closeDelimiter)}`
  );
  return pattern.test(str);
}

/**
 * Extract all variable paths from a template string
 */
export function extractTemplateVariables(
  str: string,
  openDelimiter = '{{',
  closeDelimiter = '}}'
): string[] {
  const template = createTemplate(str, { openDelimiter, closeDelimiter });
  return template.getVariables();
}

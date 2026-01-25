/**
 * @seashorelab/contextengineering - Types
 *
 * Core type definitions for context engineering
 */

/**
 * Supported date/time format options
 */
export type DateTimeFormat = 'iso' | 'locale' | 'relative' | string;

/**
 * Environment provider options
 */
export interface EnvironmentOptions {
  /**
   * Include full ISO 8601 datetime (e.g., "2026-01-17T14:30:00+08:00")
   */
  currentDateTime?: boolean;

  /**
   * Include timezone name (e.g., "Asia/Shanghai")
   */
  timezone?: boolean;

  /**
   * Include day of week (e.g., "Friday" or "星期五")
   */
  weekday?: boolean;

  /**
   * Locale for formatting (e.g., "en-US", "zh-CN")
   * Defaults to system locale
   */
  locale?: string;

  /**
   * Custom environment variables to include
   */
  custom?: Record<string, string | (() => string) | (() => Promise<string>)>;
}

/**
 * Environment context - resolved environment information
 */
export interface EnvironmentContext {
  currentTime?: string;
  currentDate?: string;
  currentDateTime?: string;
  timezone?: string;
  utcOffset?: string;
  weekday?: string;
  locale?: string;
  [key: string]: string | undefined;
}

/**
 * Environment provider interface
 */
export interface EnvironmentProvider {
  /**
   * Get environment context as an object
   */
  getContext(): Promise<EnvironmentContext>;

  /**
   * Format environment context as a string for prompt injection
   */
  format(options?: FormatOptions): Promise<string>;
}

/**
 * Format options for rendering context
 */
export interface FormatOptions {
  /**
   * Output format style
   */
  style?: 'markdown' | 'yaml' | 'plain' | 'xml';

  /**
   * Section title
   */
  title?: string;

  /**
   * Include only specific keys
   */
  include?: string[];

  /**
   * Exclude specific keys
   */
  exclude?: string[];
}

/**
 * Identity configuration for an agent
 */
export interface IdentityConfig {
  /**
   * Agent name
   */
  name: string;

  /**
   * Agent role description
   */
  role?: string;

  /**
   * Agent description
   */
  description?: string;

  /**
   * Personality traits
   */
  personality?: string[];

  /**
   * Capabilities the agent has
   */
  capabilities?: string[];

  /**
   * Constraints or limitations
   */
  constraints?: string[];
}

/**
 * Example for few-shot learning
 */
export interface Example {
  /**
   * User input
   */
  user: string;

  /**
   * Expected assistant response
   */
  assistant: string;

  /**
   * Optional explanation
   */
  explanation?: string;
}

/**
 * Context block - a section of the context
 */
export interface ContextBlock {
  /**
   * Block type identifier
   */
  type: string;

  /**
   * Block priority (lower = earlier in prompt)
   */
  priority?: number;

  /**
   * Whether this block is static (cacheable)
   */
  isStatic?: boolean;

  /**
   * Render the block to a string
   */
  render(variables?: Record<string, unknown>): Promise<string>;
}

/**
 * Context configuration
 */
export interface ContextConfig {
  /**
   * Agent identity
   */
  identity?: IdentityConfig;

  /**
   * Environment options
   */
  environment?: EnvironmentOptions | boolean;

  /**
   * Instructions for the agent
   */
  instructions?: string[];

  /**
   * Output format constraints
   */
  outputFormat?: OutputFormatConfig;

  /**
   * Few-shot examples
   */
  examples?: Example[];

  /**
   * Additional context data
   */
  context?: Record<string, unknown>;
}

/**
 * Output format configuration
 */
export interface OutputFormatConfig {
  /**
   * Output type
   */
  type?: 'text' | 'markdown' | 'json' | 'xml' | 'code';

  /**
   * Schema for structured output
   */
  schema?: Record<string, unknown>;
}

/**
 * Context builder interface
 */
export interface ContextBuilder {
  /**
   * Build the final system prompt
   */
  build(variables?: Record<string, unknown>): Promise<string>;

  /**
   * Get static portion for caching
   */
  getStaticPortion(): Promise<string>;

  /**
   * Get dynamic portion
   */
  getDynamicPortion(variables?: Record<string, unknown>): Promise<string>;
}

/**
 * Template interface
 */
export interface Template {
  /**
   * The raw template string
   */
  raw: string;

  /**
   * Render the template with variables
   */
  render(variables: Record<string, unknown>): Promise<string>;

  /**
   * Extract variable names from the template
   */
  getVariables(): string[];
}

/**
 * Template options
 */
export interface TemplateOptions {
  /**
   * Opening delimiter (default: "{{")
   */
  openDelimiter?: string;

  /**
   * Closing delimiter (default: "}}")
   */
  closeDelimiter?: string;

  /**
   * Whether to throw on missing variables (default: false)
   */
  strict?: boolean;

  /**
   * Default value for missing variables
   */
  defaultValue?: string;
}

/**
 * Preset block configuration
 */
export interface PresetConfig {
  /**
   * Custom title for the preset section
   */
  title?: string;

  /**
   * Whether to include in static portion
   */
  isStatic?: boolean;
}

/**
 * Identity preset options
 */
export interface IdentityPresetOptions extends PresetConfig {
  name: string;
  role?: string;
  personality?: string[];
}

/**
 * Time awareness preset options
 */
export interface TimeAwarenessPresetOptions extends PresetConfig {
  locale?: string;
  includeDate?: boolean;
  includeTime?: boolean;
  includeTimezone?: boolean;
  includeWeekday?: boolean;
}

/**
 * Safety guidelines preset options
 */
export interface SafetyGuidelinesPresetOptions extends PresetConfig {
  /**
   * Safety level: 'minimal' | 'standard' | 'strict'
   */
  level?: 'minimal' | 'standard' | 'strict';

  /**
   * Custom guidelines to add
   */
  customGuidelines?: string[];
}

/**
 * Code generation preset options
 */
export interface CodeGenerationPresetOptions extends PresetConfig {
  /**
   * Target programming languages
   */
  languages?: string[];

  /**
   * Code style preferences
   */
  style?: 'clean' | 'documented' | 'minimal';

  /**
   * Whether to include tests
   */
  includeTests?: boolean;
}

/**
 * Output constraints preset options
 */
export interface OutputConstraintsPresetOptions extends PresetConfig {
  /**
   * Maximum response length
   */
  maxLength?: number;

  /**
   * Output format
   */
  format?: 'markdown' | 'plain' | 'json' | 'xml';

  /**
   * Language for response
   */
  language?: string;

  /**
   * Tone of response
   */
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
}

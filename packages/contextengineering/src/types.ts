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
   * Include current time (e.g., "14:30:00")
   */
  readonly currentTime?: boolean;

  /**
   * Include current date (e.g., "2026-01-17")
   */
  readonly currentDate?: boolean;

  /**
   * Include full ISO 8601 datetime (e.g., "2026-01-17T14:30:00+08:00")
   */
  readonly currentDateTime?: boolean;

  /**
   * Include timezone name (e.g., "Asia/Shanghai")
   */
  readonly timezone?: boolean;

  /**
   * Include UTC offset (e.g., "+08:00")
   */
  readonly utcOffset?: boolean;

  /**
   * Include day of week (e.g., "Friday" or "星期五")
   */
  readonly weekday?: boolean;

  /**
   * Locale for formatting (e.g., "en-US", "zh-CN")
   * Defaults to system locale
   */
  readonly locale?: string;

  /**
   * Custom date format (e.g., "YYYY-MM-DD", "MMM DD, YYYY")
   */
  readonly dateFormat?: DateTimeFormat;

  /**
   * Custom time format (e.g., "HH:mm:ss", "hh:mm A")
   */
  readonly timeFormat?: DateTimeFormat;

  /**
   * Custom environment variables to include
   */
  readonly custom?: Record<string, string | (() => string) | (() => Promise<string>)>;
}

/**
 * Environment context - resolved environment information
 */
export interface EnvironmentContext {
  readonly currentTime?: string;
  readonly currentDate?: string;
  readonly currentDateTime?: string;
  readonly timezone?: string;
  readonly utcOffset?: string;
  readonly weekday?: string;
  readonly locale?: string;
  readonly [key: string]: string | undefined;
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
  readonly style?: 'markdown' | 'yaml' | 'plain' | 'xml';

  /**
   * Section title
   */
  readonly title?: string;

  /**
   * Include only specific keys
   */
  readonly include?: string[];

  /**
   * Exclude specific keys
   */
  readonly exclude?: string[];
}

/**
 * Identity configuration for an agent
 */
export interface IdentityConfig {
  /**
   * Agent name
   */
  readonly name: string;

  /**
   * Agent role description
   */
  readonly role?: string;

  /**
   * Agent description
   */
  readonly description?: string;

  /**
   * Personality traits
   */
  readonly personality?: readonly string[];

  /**
   * Capabilities the agent has
   */
  readonly capabilities?: readonly string[];

  /**
   * Constraints or limitations
   */
  readonly constraints?: readonly string[];
}

/**
 * Example for few-shot learning
 */
export interface Example {
  /**
   * User input
   */
  readonly user: string;

  /**
   * Expected assistant response
   */
  readonly assistant: string;

  /**
   * Optional explanation
   */
  readonly explanation?: string;
}

/**
 * Context block - a section of the context
 */
export interface ContextBlock {
  /**
   * Block type identifier
   */
  readonly type: string;

  /**
   * Block priority (lower = earlier in prompt)
   */
  readonly priority?: number;

  /**
   * Whether this block is static (cacheable)
   */
  readonly isStatic?: boolean;

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
  readonly identity?: IdentityConfig;

  /**
   * Environment options
   */
  readonly environment?: EnvironmentOptions | boolean;

  /**
   * Instructions for the agent
   */
  readonly instructions?: readonly string[];

  /**
   * Output format constraints
   */
  readonly outputFormat?: OutputFormatConfig;

  /**
   * Few-shot examples
   */
  readonly examples?: readonly Example[];

  /**
   * Custom context blocks
   */
  readonly blocks?: readonly ContextBlock[];

  /**
   * Additional context data
   */
  readonly context?: Record<string, unknown>;
}

/**
 * Output format configuration
 */
export interface OutputFormatConfig {
  /**
   * Output type
   */
  readonly type?: 'text' | 'markdown' | 'json' | 'xml' | 'code';

  /**
   * Additional constraints
   */
  readonly constraints?: readonly string[];

  /**
   * Schema for structured output
   */
  readonly schema?: Record<string, unknown>;
}

/**
 * Context builder interface
 */
export interface ContextBuilder {
  /**
   * Add identity configuration
   */
  identity(config: IdentityConfig): ContextBuilder;

  /**
   * Add environment context
   */
  environment(options?: EnvironmentOptions | boolean): ContextBuilder;

  /**
   * Add instructions
   */
  instructions(instructions: readonly string[]): ContextBuilder;

  /**
   * Add examples for few-shot learning
   */
  examples(examples: readonly Example[]): ContextBuilder;

  /**
   * Add output format constraints
   */
  outputFormat(config: OutputFormatConfig): ContextBuilder;

  /**
   * Add a custom block
   */
  block(block: ContextBlock): ContextBuilder;

  /**
   * Add custom context data
   */
  context(data: Record<string, unknown>): ContextBuilder;

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
  readonly raw: string;

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
  readonly openDelimiter?: string;

  /**
   * Closing delimiter (default: "}}")
   */
  readonly closeDelimiter?: string;

  /**
   * Whether to throw on missing variables (default: false)
   */
  readonly strict?: boolean;

  /**
   * Default value for missing variables
   */
  readonly defaultValue?: string;
}

/**
 * Preset block configuration
 */
export interface PresetConfig {
  /**
   * Custom title for the preset section
   */
  readonly title?: string;

  /**
   * Whether to include in static portion
   */
  readonly isStatic?: boolean;
}

/**
 * Identity preset options
 */
export interface IdentityPresetOptions extends PresetConfig {
  readonly name: string;
  readonly role?: string;
  readonly personality?: readonly string[];
}

/**
 * Time awareness preset options
 */
export interface TimeAwarenessPresetOptions extends PresetConfig {
  readonly locale?: string;
  readonly includeDate?: boolean;
  readonly includeTime?: boolean;
  readonly includeTimezone?: boolean;
  readonly includeWeekday?: boolean;
}

/**
 * Safety guidelines preset options
 */
export interface SafetyGuidelinesPresetOptions extends PresetConfig {
  /**
   * Safety level: 'minimal' | 'standard' | 'strict'
   */
  readonly level?: 'minimal' | 'standard' | 'strict';

  /**
   * Custom guidelines to add
   */
  readonly customGuidelines?: readonly string[];
}

/**
 * Code generation preset options
 */
export interface CodeGenerationPresetOptions extends PresetConfig {
  /**
   * Target programming languages
   */
  readonly languages?: readonly string[];

  /**
   * Code style preferences
   */
  readonly style?: 'clean' | 'documented' | 'minimal';

  /**
   * Whether to include tests
   */
  readonly includeTests?: boolean;
}

/**
 * Output constraints preset options
 */
export interface OutputConstraintsPresetOptions extends PresetConfig {
  /**
   * Maximum response length
   */
  readonly maxLength?: number;

  /**
   * Output format
   */
  readonly format?: 'markdown' | 'plain' | 'json' | 'xml';

  /**
   * Language for response
   */
  readonly language?: string;

  /**
   * Tone of response
   */
  readonly tone?: 'professional' | 'casual' | 'friendly' | 'formal';
}

/**
 * @seashorelab/contextengineering
 *
 * Context engineering utilities for building high-quality LLM prompts
 */

// Types
export type {
  // Core types
  ContextConfig,
  ContextBuilder,
  ContextBlock,
  IdentityConfig,
  Example,
  OutputFormatConfig,
  FormatOptions,

  // Environment types
  EnvironmentOptions,
  EnvironmentContext,
  EnvironmentProvider,
  DateTimeFormat,

  // Template types
  Template,
  TemplateOptions,

  // Preset types
  PresetConfig,
  IdentityPresetOptions,
  TimeAwarenessPresetOptions,
  SafetyGuidelinesPresetOptions,
  CodeGenerationPresetOptions,
  OutputConstraintsPresetOptions,
} from './types';

// Core
export { createContext, defineBlock } from './context-builder';
export {
  createTemplate,
  renderTemplate,
  hasTemplateVariables,
  extractTemplateVariables,
} from './template';

// Providers
export { createEnvironmentProvider, createEnv, env } from './environment';

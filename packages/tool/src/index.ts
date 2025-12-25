/**
 * @seashore/tool
 *
 * Type-safe tool definitions for Seashore Agent Framework
 */

// Types
export type {
  Tool,
  ToolConfig,
  ToolContext,
  ToolResult,
  RetryConfig,
  JsonSchema,
  JsonSchemaProperty,
  ToolCallRequest,
  ToolCallResponse,
} from './types.js';

// Core
export { defineTool } from './define-tool.js';
export { zodToJsonSchema } from './zod-to-json-schema.js';

// Presets
export { serperTool, type SerperConfig, type SerperResult } from './presets/serper.js';
export { firecrawlTool, type FirecrawlConfig, type FirecrawlResult } from './presets/firecrawl.js';

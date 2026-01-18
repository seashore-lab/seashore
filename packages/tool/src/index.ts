/**
 * @seashorelab/tool
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
} from './types';

// Core
export { defineTool } from './define-tool';
export { zodToJsonSchema } from './zod-to-json-schema';

// Validation
export {
  withValidation,
  ValidationError,
  composeValidators,
  createValidator,
  sanitizeString,
  sanitizeObject,
  type ValidationIssue,
  type ValidationMiddlewareOptions,
} from './validation';

// Client-side tools
export {
  defineClientTool,
  isClientTool,
  type ClientTool,
  type ClientToolConfig,
  type ClientToolPending,
} from './client-tool';

// Approval handling
export {
  withApproval,
  createMemoryApprovalHandler,
  createAutoApprovalHandler,
  inferRiskLevel,
  type ApprovalRequest,
  type ApprovalResponse,
  type ApprovalHandler,
  type ApprovalConfig,
} from './approval';

// Presets
export { serperTool, type SerperConfig, type SerperResult } from './presets/serper';
export { firecrawlTool, type FirecrawlConfig, type FirecrawlResult } from './presets/firecrawl';

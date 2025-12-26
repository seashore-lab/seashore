/**
 * @seashore/tool - Types
 *
 * Type definitions for tools
 */

import type { z, ZodSchema } from 'zod';

/**
 * Tool execution context
 */
export interface ToolContext {
  /** Unique execution ID */
  readonly executionId: string;

  /** Thread ID if within an agent conversation */
  readonly threadId?: string;

  /** User ID if available */
  readonly userId?: string;

  /** Abort signal for cancellation */
  readonly signal?: AbortSignal;

  /** Custom metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResult<T> {
  /** Whether execution succeeded */
  readonly success: boolean;

  /** Result data (if successful) */
  readonly data?: T;

  /** Error message (if failed) */
  readonly error?: string;

  /** Execution duration in milliseconds */
  readonly durationMs: number;

  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Tool configuration
 */
export interface ToolConfig<TInput extends ZodSchema, TOutput> {
  /** Tool name (unique identifier) */
  readonly name: string;

  /** Tool description (LLM uses this to decide when to call) */
  readonly description: string;

  /** Input parameter schema (Zod) */
  readonly inputSchema: TInput;

  /** Execution function */
  readonly execute: (input: z.infer<TInput>, context: ToolContext) => Promise<TOutput>;

  /** Whether user approval is required */
  readonly needsApproval?: boolean;

  /** Execution timeout in milliseconds */
  readonly timeout?: number;

  /** Retry configuration */
  readonly retry?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  readonly maxAttempts: number;

  /** Delay between retries in milliseconds */
  readonly delay: number;

  /** Backoff multiplier (default: 2) */
  readonly backoffMultiplier?: number;
}

/**
 * Tool interface
 */
export interface Tool<TInput, TOutput> {
  /** Tool name */
  readonly name: string;

  /** Tool description */
  readonly description: string;

  /** JSON Schema for LLM function calling */
  readonly jsonSchema: JsonSchema;

  /** Whether user approval is required */
  readonly needsApproval: boolean;

  /** Execute the tool */
  execute(input: TInput, context?: Partial<ToolContext>): Promise<ToolResult<TOutput>>;

  /** Validate input */
  validate(input: unknown): input is TInput;

  /** Parse and validate input (throws on invalid) */
  parse(input: unknown): TInput;
}

/**
 * JSON Schema representation
 */
export interface JsonSchema {
  readonly type: 'object';
  readonly properties: Record<string, JsonSchemaProperty>;
  readonly required: readonly string[];
  readonly additionalProperties?: boolean;
}

/**
 * JSON Schema property
 */
export interface JsonSchemaProperty {
  readonly type: string;
  readonly description?: string;
  readonly enum?: readonly unknown[];
  readonly items?: JsonSchemaProperty;
  readonly properties?: Record<string, JsonSchemaProperty>;
  readonly required?: readonly string[];
}

/**
 * Tool call from LLM
 */
export interface ToolCallRequest {
  readonly id: string;
  readonly name: string;
  readonly arguments: string; // JSON string
}

/**
 * Tool call response
 */
export interface ToolCallResponse {
  readonly id: string;
  readonly name: string;
  readonly result: ToolResult<unknown>;
}

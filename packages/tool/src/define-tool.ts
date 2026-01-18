/**
 * @seashorelab/tool - Define Tool
 *
 * Main function for creating type-safe tools
 */

import type { z, ZodSchema } from 'zod';
import { zodToJsonSchema } from './zod-to-json-schema';
import type { Tool, ToolConfig, ToolContext, ToolResult, JsonSchema } from './types';

/**
 * Default timeout for tool execution (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Define a type-safe tool with Zod schema validation
 *
 * @example
 * ```typescript
 * import { defineTool } from '@seashorelab/tool';
 * import { z } from 'zod';
 *
 * const calculatorTool = defineTool({
 *   name: 'calculator',
 *   description: 'Perform mathematical calculations',
 *   inputSchema: z.object({
 *     expression: z.string().describe('Math expression to evaluate'),
 *   }),
 *   execute: async ({ expression }) => {
 *     return { result: eval(expression) };
 *   },
 * });
 * ```
 */
export function defineTool<TInput extends ZodSchema, TOutput>(
  config: ToolConfig<TInput, TOutput>
): Tool<z.infer<TInput>, TOutput> {
  const {
    name,
    description,
    inputSchema,
    execute,
    needsApproval = false,
    timeout = DEFAULT_TIMEOUT,
    retry,
  } = config;

  // Convert Zod schema to JSON Schema for LLM
  const jsonSchema = zodToJsonSchema(inputSchema) as JsonSchema;

  return {
    name,
    description,
    jsonSchema,
    needsApproval,

    validate(input: unknown): input is z.infer<TInput> {
      const result = inputSchema.safeParse(input);
      return result.success;
    },

    parse(input: unknown): z.infer<TInput> {
      return inputSchema.parse(input) as z.infer<TInput>;
    },

    async execute(
      input: z.infer<TInput>,
      partialContext?: Partial<ToolContext>
    ): Promise<ToolResult<TOutput>> {
      const startTime = Date.now();

      // Build context with defaults
      const context: ToolContext = {
        executionId: crypto.randomUUID(),
        ...partialContext,
      };

      try {
        // Validate input
        const validInput = inputSchema.parse(input) as z.infer<TInput>;

        // Execute with timeout and retry
        const result = await executeWithRetry(
          () => executeWithTimeout(execute, validInput, context, timeout),
          retry
        );

        return {
          success: true,
          data: result,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          success: false,
          error: errorMessage,
          durationMs: Date.now() - startTime,
        };
      }
    },
  };
}

/**
 * Execute function with timeout
 */
async function executeWithTimeout<TInput, TOutput>(
  execute: (input: TInput, context: ToolContext) => Promise<TOutput>,
  input: TInput,
  context: ToolContext,
  timeout: number
): Promise<TOutput> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Merge abort signals
  const mergedSignal =
    context.signal !== undefined
      ? mergeAbortSignals(context.signal, controller.signal)
      : controller.signal;

  try {
    const result = await Promise.race([
      execute(input, { ...context, signal: mergedSignal }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`Tool execution timed out after ${timeout}ms`));
        });
      }),
    ]);

    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Execute function with retry logic
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retry?: { maxAttempts: number; delay: number; backoffMultiplier?: number }
): Promise<T> {
  if (retry === undefined) {
    return fn();
  }

  const { maxAttempts, delay, backoffMultiplier = 2 } = retry;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const waitTime = delay * Math.pow(backoffMultiplier, attempt);
        await sleep(waitTime);
      }
    }
  }

  throw lastError ?? new Error('Unknown error during retry');
}

/**
 * Merge multiple abort signals
 */
function mergeAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    });
  }

  return controller.signal;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

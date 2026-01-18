/**
 * @seashorelab/agent - Error Handler
 *
 * Error handling and retry logic for agent execution
 */

/**
 * Agent execution error
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: AgentErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Error codes for agent errors
 */
export type AgentErrorCode =
  | 'MAX_ITERATIONS_EXCEEDED'
  | 'TOOL_EXECUTION_FAILED'
  | 'LLM_ERROR'
  | 'VALIDATION_ERROR'
  | 'ABORTED'
  | 'UNKNOWN';

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AgentError) {
    // Tool execution failures and LLM errors may be retryable
    return error.code === 'TOOL_EXECUTION_FAILED' || error.code === 'LLM_ERROR';
  }

  if (error instanceof Error) {
    // Network-related errors are typically retryable
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('502')
    );
  }

  return false;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error) || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay with backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError ?? new Error('Unknown error during retry');
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if execution was aborted
 */
export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted === true) {
    throw new AgentError('Agent execution was aborted', 'ABORTED');
  }
}

/**
 * Wrap error with AgentError
 */
export function wrapError(error: unknown, code: AgentErrorCode): AgentError {
  if (error instanceof AgentError) {
    return error;
  }

  const cause = error instanceof Error ? error : undefined;
  const message = error instanceof Error ? error.message : String(error);

  return new AgentError(message, code, cause);
}

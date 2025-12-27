/**
 * @seashore/agent
 *
 * ReAct and Workflow agents for Seashore Agent Framework
 */

// Types
export type {
  Agent,
  AgentConfig,
  AgentRunResult,
  AgentStreamChunk,
  AgentStreamChunkType,
  RunOptions,
  ToolCallRecord,
  AgentToolContext,
} from './types';

// Agent creation
export { createAgent } from './create-agent';

// ReAct agent (direct export for advanced use)
export { createAgent as createReActAgent } from './react-agent';

// Tool execution
export { executeTool, executeTools, formatToolResult, type ToolCallRequest } from './tool-executor';

// Error handling
export {
  AgentError,
  type AgentErrorCode,
  isRetryableError,
  withRetry,
  type RetryConfig,
  DEFAULT_RETRY_CONFIG,
  checkAborted,
  wrapError,
} from './error-handler';

// Streaming utilities
export { collectStream, StreamChunks, streamToReadable, parseSSEStream } from './stream';

// Workflow agent integration
export {
  createWorkflowAgent,
  createAgentNode,
  composeAgents,
  type WorkflowAgentConfig,
  type WorkflowAgentInput,
  type WorkflowAgentOutput,
} from './workflow-agent';

// Storage integration
export {
  withStorage,
  type WithStorageConfig,
  type StorageRunOptions,
  type AgentWithStorage,
} from './with-storage';

// Thread continuation
export {
  createThreadManager,
  continueThread,
  streamContinueThread,
  type ThreadManager,
  type ThreadContext,
  type ThreadContinuationOptions,
} from './thread';

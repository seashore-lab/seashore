/**
 * @seashorelab/workflow - Types
 *
 * Type definitions for workflow orchestration
 */

import type { ZodSchema } from 'zod';
import type { TextAdapter } from '@seashorelab/llm';

// Re-export adapter types for convenience
export type { TextAdapter };

/**
 * Tool interface (compatible with @seashore/tool)
 */
export interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  execute(input: TInput): Promise<{ success: boolean; data?: TOutput; error?: string }>;
}

/**
 * Workflow configuration for createWorkflow
 */
export interface WorkflowConfig {
  /** Workflow name */
  name: string;

  /** Workflow description */
  description?: string;

  /** Workflow nodes (array format for creation) */
  nodes: WorkflowNode[];

  /** Edges connecting nodes */
  edges: Edge[];

  /** Entry/start node name (optional, defaults to first node without incoming edges) */
  startNode?: string;

  /** Global timeout in milliseconds */
  timeout?: number;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Edge between nodes
 */
export interface Edge {
  /** Source node name */
  from: string;

  /** Target node name */
  to: string;

  /** Optional condition for this edge */
  condition?: (ctx: WorkflowContext) => boolean | Promise<boolean>;
}

/**
 * Loop configuration
 */
export interface LoopConfig {
  /** Nodes included in the loop */
  nodes: string[];

  /** Maximum iterations */
  maxIterations: number;

  /** Exit condition */
  exitCondition?: (ctx: WorkflowContext) => boolean | Promise<boolean>;
}

/**
 * Base workflow node interface
 */
export interface WorkflowNode<TInput = unknown, TOutput = unknown> {
  /** Node name */
  name: string;

  /** Node type */
  type?: NodeType;

  /** Execute the node */
  execute: (input: TInput, ctx: WorkflowContext) => Promise<TOutput>;

  /** Input schema for validation */
  inputSchema?: ZodSchema;

  /** Output schema for validation */
  outputSchema?: ZodSchema;
}

/**
 * Node types
 */
export type NodeType = 'llm' | 'tool' | 'condition' | 'parallel' | 'custom';

/**
 * LLM node configuration
 */
export interface LLMNodeConfig {
  /** Node name */
  name: string;

  /** LLM model adapter */
  model: TextAdapter;

  /** Static prompt or dynamic prompt function */
  prompt?: string | ((input: unknown, ctx: WorkflowContext) => string | Promise<string>);

  /** Messages builder */
  messages?: (input: unknown, ctx: WorkflowContext) => Array<{ role: string; content: string }>;

  /** System prompt */
  systemPrompt?: string;

  /** Tools available to this node */
  tools?: Tool<unknown, unknown>[];

  /** Output schema for structured output */
  outputSchema?: ZodSchema;

  /** Temperature */
  temperature?: number;

  /** Max tokens */
  maxTokens?: number;
}

/**
 * Tool node configuration
 */
export interface ToolNodeConfig<TToolInput = unknown, TToolOutput = unknown> {
  /** Node name */
  name: string;

  /** Tool to execute */
  tool: Tool<TToolInput, TToolOutput>;

  /** Input mapping function */
  input?: (nodeInput: unknown, ctx: WorkflowContext) => TToolInput;

  /** Output transform function */
  transform?: (result: TToolOutput) => unknown;
}

/**
 * Condition node configuration
 */
export interface ConditionNodeConfig {
  /** Node name */
  name: string;

  /** Condition to evaluate */
  condition: (ctx: WorkflowContext) => boolean | Promise<boolean>;

  /** Target node if true */
  ifTrue: string;

  /** Target node if false */
  ifFalse: string;
}

/**
 * Parallel node configuration
 */
export interface ParallelNodeConfig {
  /** Node name */
  name: string;

  /** Branches to execute in parallel (static) */
  branches?: WorkflowNode[];

  /** Dynamic parallel - items generator */
  forEach?: (input: unknown, ctx: WorkflowContext) => unknown[];

  /** Node to execute for each item (when using forEach) */
  node?: WorkflowNode;

  /** Merge function for results */
  merge?: (results: unknown[]) => unknown;

  /** Maximum concurrency */
  maxConcurrency?: number;

  /** Failure policy */
  failurePolicy?: 'all' | 'partial' | 'none';
}

/**
 * Custom node configuration
 */
export interface CustomNodeConfig<TInput = unknown, TOutput = unknown> {
  /** Node name */
  name: string;

  /** Execution function */
  execute: (input: TInput, ctx: WorkflowContext) => Promise<TOutput>;

  /** Input schema */
  inputSchema?: ZodSchema;

  /** Output schema */
  outputSchema?: ZodSchema;
}

/**
 * Workflow context available to nodes - mutable during execution
 */
export interface WorkflowContext {
  /** Node outputs collected during execution */
  nodeOutputs: Record<string, unknown>;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Current node being executed */
  currentNode?: string;

  /** Execution path so far */
  executionPath?: string[];

  /** Loop state (if in a loop) */
  loopState?: {
    index: number;
    iteration: number;
    isFirst: boolean;
    isLast: boolean;
    value?: unknown;
    accumulator?: unknown;
  };

  /** Abort signal */
  signal?: AbortSignal;

  /** Get node output with type safety */
  getNodeOutput<T = unknown>(nodeName: string): T | undefined;
}

/**
 * Mutable context for internal use during execution
 */
export interface MutableWorkflowContext {
  /** Node outputs */
  nodeOutputs: Record<string, unknown>;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Current node */
  currentNode?: string;

  /** Execution path */
  executionPath: string[];

  /** Loop state */
  loopState?: {
    index: number;
    iteration: number;
    isFirst: boolean;
    isLast: boolean;
    value?: unknown;
    accumulator?: unknown;
  };

  /** Signal */
  signal?: AbortSignal;

  /** Set node output */
  setNodeOutput(nodeName: string, output: unknown): void;

  /** Get node output */
  getNodeOutput<T = unknown>(nodeName: string): T | undefined;

  /** Set metadata */
  setMetadata(key: string, value: unknown): void;

  /** Get metadata */
  getMetadata<T = unknown>(key: string): T | undefined;

  /** Update loop state */
  updateLoopState(updates: Partial<NonNullable<MutableWorkflowContext['loopState']>>): void;

  /** Convert to immutable context */
  toContext(): WorkflowContext;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult<TOutput = unknown> {
  /** Final output */
  output: TOutput;

  /** Execution path taken */
  nodeExecutionOrder: string[];

  /** Node outputs */
  nodeOutputs: Record<string, unknown>;

  /** Total duration in milliseconds */
  durationMs: number;

  /** Workflow context at completion */
  context?: WorkflowContext;

  /** Get node output with type safety */
  getNodeOutput<T = unknown>(nodeName: string): T | undefined;
}

/**
 * Workflow execution options
 */
export interface WorkflowExecutionOptions {
  /** Timeout in milliseconds */
  timeout?: number;

  /** Abort signal */
  signal?: AbortSignal;

  /** Maximum iterations (for loop protection) */
  maxIterations?: number;

  /** Initial metadata */
  metadata?: Record<string, unknown>;

  /** Event callback */
  onEvent?: (event: WorkflowEvent) => void;
}

/**
 * LLM token event data
 */
export interface LLMTokenEventData {
  /** Node name that produced this token */
  nodeName: string;
  /** Token delta content */
  delta: string;
  /** Accumulated content so far */
  content: string;
}

/**
 * Workflow stream event - discriminated union for type-safe event handling
 */
export type WorkflowEvent =
  | {
      type: 'workflow_start';
      timestamp: number;
      data: {
        input: unknown;
      };
    }
  | {
      type: 'node_start';
      timestamp: number;
      data: {
        nodeName: string;
        input: unknown;
      };
    }
  | {
      type: 'node_complete';
      timestamp: number;
      data: {
        nodeName: string;
        output: unknown;
      };
    }
  | {
      type: 'node_error';
      timestamp: number;
      data: {
        nodeName: string;
        error: unknown;
      };
    }
  | {
      type: 'workflow_complete';
      timestamp: number;
      data: {
        output: unknown;
      };
    }
  | {
      type: 'workflow_error';
      timestamp: number;
      data: {
        error: unknown;
      };
    }
  | {
      type: 'llm_token';
      timestamp: number;
      data: LLMTokenEventData;
    };

/**
 * Workflow stream event types (for convenience)
 */
export type WorkflowEventType = WorkflowEvent['type'];

/**
 * Token callback for streaming LLM nodes
 */
export type OnTokenCallback = (data: LLMTokenEventData) => void;

/**
 * Extended workflow context with streaming support
 */
export interface StreamingWorkflowContext extends WorkflowContext {
  /** Callback for token-level streaming */
  onToken?: OnTokenCallback;
}

/**
 * Workflow instance
 */
export interface Workflow<TInput = unknown, TOutput = unknown> {
  /** Workflow configuration */
  config: WorkflowConfig;

  /** Input type marker (never accessed at runtime) */
  readonly __inputType?: TInput;

  /** Output type marker (never accessed at runtime) */
  readonly __outputType?: TOutput;
}

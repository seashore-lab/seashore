/**
 * @seashorelab/agent - Workflow Agent
 *
 * Integration between Agent and Workflow packages
 */

import type { Message } from '@seashorelab/llm';
import type { Agent, AgentRunResult, AgentStreamChunk, RunOptions } from './types';
import type {
  Workflow,
  WorkflowExecutionResult,
  WorkflowExecutionOptions,
} from '@seashorelab/workflow';
import { executeWorkflow } from '@seashorelab/workflow';

/**
 * Workflow agent configuration
 */
export interface WorkflowAgentConfig {
  /** Agent name */
  name: string;

  /** Workflow to execute */
  workflow: Workflow<WorkflowAgentInput, WorkflowAgentOutput>;

  /** Default execution options */
  defaultOptions?: WorkflowExecutionOptions;
}

/**
 * Input for workflow agent
 */
export interface WorkflowAgentInput {
  /** User message */
  message: string;

  /** Conversation history */
  messages?: Message[];

  /** Custom context */
  context?: Record<string, unknown>;
}

/**
 * Output from workflow agent
 */
export interface WorkflowAgentOutput {
  /** Response content */
  content: string;

  /** Structured output (optional) */
  structured?: unknown;

  /** Execution metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Create a workflow-based agent
 *
 * @example
 * ```typescript
 * import { createWorkflowAgent } from '@seashorelab/agent';
 * import { createWorkflow, createLLMNode, createToolNode } from '@seashorelab/workflow';
 *
 * const workflow = createWorkflow({
 *   name: 'research-workflow',
 *   nodes: [
 *     createLLMNode({
 *       name: 'analyze',
 *       adapter: openaiAdapter,
 *       messages: (input) => [
 *         { role: 'system', content: 'Analyze the user query' },
 *         { role: 'user', content: input.message },
 *       ],
 *     }),
 *     createToolNode({
 *       name: 'search',
 *       tool: searchTool,
 *       input: (_, ctx) => ({ query: ctx.nodeOutputs['analyze'].query }),
 *     }),
 *     createLLMNode({
 *       name: 'respond',
 *       adapter: openaiAdapter,
 *       messages: (input, ctx) => [
 *         { role: 'system', content: 'Respond based on search results' },
 *         { role: 'user', content: JSON.stringify(ctx.nodeOutputs['search']) },
 *       ],
 *     }),
 *   ],
 *   edges: [
 *     { from: 'analyze', to: 'search' },
 *     { from: 'search', to: 'respond' },
 *   ],
 * });
 *
 * const agent = createWorkflowAgent({
 *   name: 'research-agent',
 *   workflow,
 * });
 *
 * const result = await agent.run({ message: 'What is the capital of France?' });
 * console.log(result.content);
 * ```
 */
export function createWorkflowAgent(config: WorkflowAgentConfig): Agent & {
  runWorkflow: (
    input: WorkflowAgentInput,
    options?: WorkflowExecutionOptions
  ) => Promise<WorkflowExecutionResult<WorkflowAgentOutput>>;
} {
  const { name, workflow, defaultOptions = {} } = config;

  // Internal function that executes the workflow with WorkflowAgentInput
  async function executeWithInput(
    input: WorkflowAgentInput,
    options: RunOptions = {}
  ): Promise<AgentRunResult> {
    const startTime = Date.now();

    const workflowOptions: WorkflowExecutionOptions = {
      ...defaultOptions,
      signal: options.signal,
    };

    const result = await executeWorkflow(workflow, input, workflowOptions);
    const output = result.output;

    return {
      content: output.content,
      structured: output.structured,
      toolCalls: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      durationMs: Date.now() - startTime,
      finishReason: 'stop',
    };
  }

  // Create a run function that accepts string input (Agent interface)
  async function run(input: string, options: RunOptions = {}): Promise<AgentRunResult> {
    return executeWithInput({ message: input }, options);
  }

  // Create a streaming run (not fully implemented for workflows)
  async function* stream(input: string, options: RunOptions = {}): AsyncIterable<AgentStreamChunk> {
    const result = await run(input, options);

    // Emit the content as a single chunk
    yield { type: 'content', delta: result.content };
    yield { type: 'finish', result };
  }

  // Chat function for Agent interface
  async function* chat(
    _messages: readonly Message[],
    _options: RunOptions = {}
  ): AsyncIterable<AgentStreamChunk> {
    // Not implemented for workflow agents - could be extended to support conversation
    throw new Error('chat() is not implemented for workflow agents');
  }

  // Full workflow execution with detailed result
  async function runWorkflow(
    input: WorkflowAgentInput,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult<WorkflowAgentOutput>> {
    return executeWorkflow(workflow, input, { ...defaultOptions, ...options });
  }

  return {
    name,
    tools: [] as const,
    run,
    stream,
    chat,
    runWorkflow,
  };
}

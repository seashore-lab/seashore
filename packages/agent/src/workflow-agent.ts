/**
 * @seashorelab/agent - Workflow Agent
 *
 * Integration between Agent and Workflow packages
 */

import type { Message } from '@seashorelab/llm';
import type { Agent, AgentRunResult, AgentStreamChunk, RunOptions } from './types';
import type {
  Workflow,
  WorkflowNode,
  WorkflowContext,
  WorkflowExecutionResult,
  WorkflowExecutionOptions,
} from '@seashorelab/workflow';
import { createWorkflow, createNode, executeWorkflow } from '@seashorelab/workflow';

/**
 * Workflow agent configuration
 */
export interface WorkflowAgentConfig {
  /** Agent name */
  readonly name: string;

  /** Workflow to execute */
  readonly workflow: Workflow<WorkflowAgentInput, WorkflowAgentOutput>;

  /** Default execution options */
  readonly defaultOptions?: WorkflowExecutionOptions;
}

/**
 * Input for workflow agent
 */
export interface WorkflowAgentInput {
  /** User message */
  readonly message: string;

  /** Conversation history */
  readonly messages?: readonly Message[];

  /** Custom context */
  readonly context?: Record<string, unknown>;
}

/**
 * Output from workflow agent
 */
export interface WorkflowAgentOutput {
  /** Response content */
  readonly content: string;

  /** Structured output (optional) */
  readonly structured?: unknown;

  /** Execution metadata */
  readonly metadata?: Record<string, unknown>;
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

/**
 * Create an agent node for use in workflows
 *
 * @example
 * ```typescript
 * import { createAgentNode } from '@seashorelab/agent';
 * import { createAgent } from '@seashorelab/agent';
 *
 * const researchAgent = createAgent({
 *   name: 'researcher',
 *   model: openaiAdapter,
 *   systemPrompt: 'You are a research assistant.',
 *   tools: [searchTool],
 * });
 *
 * const agentNode = createAgentNode({
 *   name: 'research-step',
 *   agent: researchAgent,
 *   extractMessage: (input) => input.query,
 * });
 * ```
 */
export function createAgentNode(config: {
  name: string;
  agent: Agent;
  extractMessage: (input: unknown, ctx: WorkflowContext) => string;
  options?: RunOptions;
}): WorkflowNode<unknown, AgentRunResult> {
  const { name, agent, extractMessage, options = {} } = config;

  return createNode({
    name,
    execute: async (input, ctx) => {
      const message = extractMessage(input, ctx);
      return agent.run(message, {
        ...options,
        signal: ctx.signal,
      });
    },
  });
}

/**
 * Compose multiple agents into a workflow
 *
 * @example
 * ```typescript
 * import { composeAgents } from '@seashorelab/agent';
 *
 * const composedWorkflow = composeAgents({
 *   name: 'multi-agent-pipeline',
 *   agents: [
 *     { agent: plannerAgent, name: 'planner' },
 *     { agent: researchAgent, name: 'researcher' },
 *     { agent: writerAgent, name: 'writer' },
 *   ],
 *   inputExtractor: (prevResult, input, ctx) => {
 *     if (!prevResult) return input.message;
 *     return prevResult.content;
 *   },
 * });
 * ```
 */
export function composeAgents(config: {
  name: string;
  agents: Array<{ agent: Agent; name: string }>;
  inputExtractor?: (
    prevResult: AgentRunResult | null,
    input: WorkflowAgentInput,
    ctx: WorkflowContext
  ) => string;
}): Workflow<WorkflowAgentInput, WorkflowAgentOutput> {
  const { name, agents, inputExtractor } = config;

  const defaultExtractor = (
    prevResult: AgentRunResult | null,
    input: WorkflowAgentInput
  ): string => {
    if (!prevResult) return input.message;
    return prevResult.content;
  };

  const extract = inputExtractor ?? defaultExtractor;

  // Create nodes for each agent
  const nodes = agents.map(({ agent, name: nodeName }, index) =>
    createNode<WorkflowAgentInput, AgentRunResult>({
      name: nodeName,
      execute: async (input, ctx) => {
        const prevAgent = index > 0 ? agents[index - 1] : null;
        const prevNodeName = prevAgent?.name ?? null;
        const prevResult = prevNodeName ? (ctx.nodeOutputs[prevNodeName] as AgentRunResult) : null;

        const message = extract(prevResult, input, ctx);
        return agent.run(message, { signal: ctx.signal });
      },
    })
  );

  // Create edges to chain agents sequentially
  const edges = agents.slice(1).map((_, index) => {
    const fromAgent = agents[index];
    const toAgent = agents[index + 1];
    if (!fromAgent || !toAgent) {
      throw new Error('Invalid agent chain configuration');
    }
    return {
      from: fromAgent.name,
      to: toAgent.name,
    };
  });

  // Add final output transformation node
  const outputNode = createNode<unknown, WorkflowAgentOutput>({
    name: '_output',
    execute: async (_, ctx) => {
      const lastAgent = agents[agents.length - 1];
      if (!lastAgent) {
        throw new Error('No agents configured in workflow');
      }
      const lastAgentName = lastAgent.name;
      const lastResult = ctx.nodeOutputs[lastAgentName] as AgentRunResult;

      return {
        content: lastResult.content,
        structured: lastResult.structured,
        metadata: {
          agentChain: agents.map((a) => a.name),
        },
      };
    },
  });

  // Add edge from last agent to output
  const lastAgentForEdge = agents[agents.length - 1];
  if (agents.length > 0 && lastAgentForEdge) {
    edges.push({
      from: lastAgentForEdge.name,
      to: '_output',
    });
  }

  return createWorkflow({
    name,
    nodes: [...nodes, outputNode] as WorkflowNode[],
    edges,
  });
}

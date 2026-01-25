/**
 * @seashorelab/workflow - Workflow Factory
 *
 * Create workflow instances from configuration
 */

import type { WorkflowConfig, Workflow } from './types';

/**
 * Workflow configuration validation error
 */
export class WorkflowConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowConfigError';
  }
}

/**
 * Validate workflow configuration
 */
function validateWorkflowConfig(config: WorkflowConfig): void {
  const { nodes, edges, startNode } = config;

  // Check for duplicate node names
  const nodeNames = new Set<string>();
  for (const node of nodes) {
    if (nodeNames.has(node.name)) {
      throw new WorkflowConfigError(`Duplicate node name: "${node.name}"`);
    }
    nodeNames.add(node.name);
  }

  // Validate edge references
  for (const edge of edges) {
    if (!nodeNames.has(edge.from)) {
      throw new WorkflowConfigError(`Edge references non-existent source node: "${edge.from}"`);
    }
    if (!nodeNames.has(edge.to)) {
      throw new WorkflowConfigError(`Edge references non-existent target node: "${edge.to}"`);
    }
  }

  // Validate start node if specified
  if (startNode && !nodeNames.has(startNode)) {
    throw new WorkflowConfigError(`Start node "${startNode}" not found in nodes`);
  }
}

/**
 * Create a workflow from configuration
 *
 * @example
 * ```typescript
 * import { createWorkflow, createLLMNode, executeWorkflow } from '@seashorelab/workflow';
 * import { createWorkflowAgent } from '@seashorelab/agent';
 * import { openaiText } from '@seashorelab/llm';
 *
 * const analyzeNode = createLLMNode({
 *   name: 'analyze',
 *   adapter: openaiText('gpt-4o'),
 *   prompt: 'Analyze the user query',
 * });
 *
 * const respondNode = createLLMNode({
 *   name: 'respond',
 *   adapter: openaiText('gpt-4o'),
 *   messages: (input, ctx) => [
 *     { role: 'system', content: 'Respond based on analysis' },
 *     { role: 'user', content: JSON.stringify(ctx.nodeOutputs['analyze']) },
 *   ],
 * });
 *
 * const workflow = createWorkflow({
 *   name: 'customer-support',
 *   nodes: [analyzeNode, respondNode],
 *   edges: [
 *     { from: 'analyze', to: 'respond' },
 *   ],
 * });
 *
 * // Execute via agent
 * const agent = createWorkflowAgent({ name: 'support-agent', workflow });
 * const result = await agent.execute({ message: 'Help me!' });
 *
 * // Or execute directly
 * const result = await executeWorkflow(workflow, { query: 'Help me!' });
 * ```
 */
export function createWorkflow<TInput = unknown, TOutput = unknown>(
  config: WorkflowConfig
): Workflow<TInput, TOutput> {
  // Validate configuration
  validateWorkflowConfig(config);

  const workflow: Workflow<TInput, TOutput> = {
    config,
  };

  return workflow;
}

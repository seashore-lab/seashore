/**
 * @seashorelab/agent - Create Agent
 *
 * Factory function for creating agents
 */

import type { Tool } from '@seashorelab/tool';
import type { Agent, AgentConfig } from './types';
import { createAgent as createReActAgent } from './react-agent';

/**
 * Create an agent
 *
 * This is the main entry point for creating agents.
 * Currently supports ReAct agents with tool calling.
 *
 * @example
 * ```typescript
 * import { createAgent } from '@seashorelab/agent';
 * import { openaiText } from '@seashorelab/llm';
 *
 * const agent = createAgent({
 *   name: 'Assistant',
 *   systemPrompt: 'You are a helpful assistant.',
 *   model: openaiText('gpt-4o'),
 *   tools: [myTool],
 * });
 *
 * const result = await agent.run('Hello!');
 * ```
 */
export function createAgent<
  TTools extends readonly Tool<unknown, unknown>[] = readonly Tool<unknown, unknown>[],
>(config: AgentConfig<TTools>): Agent<TTools> {
  return createReActAgent(config);
}

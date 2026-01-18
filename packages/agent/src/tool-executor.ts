/**
 * @seashorelab/agent - Tool Executor
 *
 * Handles execution of tools during agent runs
 */

import type { Tool, ToolContext } from '@seashorelab/tool';
import type { AgentToolContext, ToolCallRecord } from './types';

/**
 * Tool call request from LLM
 */
export interface ToolCallRequest {
  readonly id: string;
  readonly name: string;
  readonly arguments: string;
}

/**
 * Execute a single tool call
 */
export async function executeTool(
  tool: Tool<unknown, unknown>,
  request: ToolCallRequest,
  agentContext: AgentToolContext
): Promise<ToolCallRecord> {
  const startTime = Date.now();

  try {
    // Parse arguments
    const args = JSON.parse(request.arguments) as unknown;

    // Build tool context
    const toolContext: Partial<ToolContext> = {
      threadId: agentContext.threadId,
      userId: agentContext.userId,
      signal: agentContext.signal,
      metadata: {
        agentName: agentContext.agentName,
      },
    };

    // Execute tool
    const result = await tool.execute(args, toolContext);

    return {
      id: request.id,
      name: request.name,
      arguments: args,
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      id: request.id,
      name: request.name,
      arguments: request.arguments,
      result: {
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Execute multiple tool calls (potentially in parallel)
 */
export async function executeTools(
  tools: readonly Tool<unknown, unknown>[],
  requests: readonly ToolCallRequest[],
  agentContext: AgentToolContext,
  parallel: boolean = true
): Promise<ToolCallRecord[]> {
  // Create tool lookup map
  const toolMap = new Map<string, Tool<unknown, unknown>>();
  for (const tool of tools) {
    toolMap.set(tool.name, tool);
  }

  if (parallel) {
    // Execute all tools in parallel
    const results = await Promise.all(
      requests.map(async (request) => {
        const tool = toolMap.get(request.name);
        if (tool === undefined) {
          return {
            id: request.id,
            name: request.name,
            arguments: request.arguments,
            result: {
              success: false,
              error: `Tool not found: ${request.name}`,
              durationMs: 0,
            },
          } satisfies ToolCallRecord;
        }
        return executeTool(tool, request, agentContext);
      })
    );
    return results;
  } else {
    // Execute tools sequentially
    const results: ToolCallRecord[] = [];
    for (const request of requests) {
      const tool = toolMap.get(request.name);
      if (tool === undefined) {
        results.push({
          id: request.id,
          name: request.name,
          arguments: request.arguments,
          result: {
            success: false,
            error: `Tool not found: ${request.name}`,
            durationMs: 0,
          },
        });
        continue;
      }
      const result = await executeTool(tool, request, agentContext);
      results.push(result);
    }
    return results;
  }
}

/**
 * Format tool result as message content
 */
export function formatToolResult(record: ToolCallRecord): string {
  if (record.result.success) {
    return JSON.stringify(record.result.data);
  } else {
    return `Error: ${record.result.error}`;
  }
}

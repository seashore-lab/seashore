/**
 * @seashore/agent - Agent 核心接口契约
 */

import type { LLMClient } from './llm'
import type { Tool } from './tool'
import type { Message } from '@tanstack/ai'

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Agent 模式
 */
export type AgentMode = 'react' | 'workflow'

/**
 * Agent 配置
 */
export interface AgentConfig {
  /**
   * Agent 名称
   */
  name?: string

  /**
   * Agent 描述
   */
  description?: string

  /**
   * LLM 客户端
   */
  llm: LLMClient

  /**
   * 可用工具列表
   */
  tools?: Tool[]

  /**
   * 系统提示词
   */
  systemPrompt?: string

  /**
   * 最大迭代次数 (Re-Act 模式)
   */
  maxIterations?: number

  /**
   * 超时时间 (毫秒)
   */
  timeout?: number

  /**
   * 内存配置
   */
  memory?: MemoryConfig

  /**
   * 可观测性配置
   */
  observability?: ObservabilityConfig
}

/**
 * 内存配置
 */
export interface MemoryConfig {
  enabled: boolean
  shortTerm?: boolean
  midTerm?: boolean
  longTerm?: boolean
}

/**
 * 可观测性配置
 */
export interface ObservabilityConfig {
  enabled: boolean
  tracer?: unknown // OpenTelemetry Tracer
}

/**
 * Agent 实例
 */
export interface Agent {
  readonly name: string
  readonly mode: AgentMode
  readonly tools: Tool[]

  /**
   * 执行单次对话
   */
  run(input: string | AgentInput): Promise<AgentOutput>

  /**
   * 执行流式对话
   */
  stream(input: string | AgentInput): AsyncIterable<AgentStreamEvent>

  /**
   * 执行带上下文的对话
   */
  chat(options: AgentChatOptions): Promise<AgentOutput>
}

/**
 * Agent 输入
 */
export interface AgentInput {
  message: string
  context?: Record<string, unknown>
  threadId?: string
}

/**
 * Agent 输出
 */
export interface AgentOutput {
  content: string
  toolCalls?: Array<{
    name: string
    arguments: unknown
    result: unknown
  }>
  usage?: {
    totalTokens: number
    iterationCount: number
    duration: number
  }
  metadata?: Record<string, unknown>
}

/**
 * 流式事件
 */
export type AgentStreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'text'; content: string }
  | { type: 'tool-call-start'; name: string; id: string }
  | { type: 'tool-call-args'; content: string }
  | { type: 'tool-call-end'; result: unknown }
  | { type: 'done'; output: AgentOutput }

/**
 * 聊天选项
 */
export interface AgentChatOptions {
  message: string
  history?: Message[]
  context?: Record<string, unknown>
}

// ============================================================================
// Re-Act Agent
// ============================================================================

/**
 * Re-Act Agent 配置
 */
export interface ReActAgentConfig extends AgentConfig {
  /**
   * 思考提示词模板
   */
  thinkingPrompt?: string

  /**
   * 工具选择策略
   */
  toolSelectionStrategy?: 'auto' | 'required' | 'none'
}

/**
 * 创建 Re-Act Agent
 *
 * @example
 * ```typescript
 * import { createReActAgent } from "@seashore/agent";
 * import { createLLMClient } from "@seashore/llm";
 * import { createSerperTool } from "@seashore/tool";
 *
 * const llm = createLLMClient({
 *   provider: "openai",
 *   model: "gpt-4o",
 * });
 *
 * const agent = createReActAgent({
 *   name: "SearchAgent",
 *   llm,
 *   tools: [createSerperTool({ apiKey: "..." })],
 *   systemPrompt: "You are a helpful search assistant.",
 * });
 *
 * const result = await agent.run("What is the weather in Beijing?");
 * console.log(result.content);
 * ```
 */
export function createReActAgent(config: ReActAgentConfig): Agent

// ============================================================================
// Workflow Agent
// ============================================================================

/**
 * Workflow Agent 配置
 */
export interface WorkflowAgentConfig extends AgentConfig {
  /**
   * 工作流定义 ID 或内联定义
   */
  workflow: string | WorkflowDefinition
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

/**
 * 工作流节点
 */
export interface WorkflowNode {
  id: string
  type: 'start' | 'end' | 'llm' | 'tool' | 'condition' | 'parallel' | 'custom'
  config?: Record<string, unknown>
}

/**
 * 工作流边
 */
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

/**
 * 创建 Workflow Agent
 *
 * @example
 * ```typescript
 * import { createWorkflowAgent } from "@seashore/agent";
 *
 * const agent = createWorkflowAgent({
 *   name: "ProcessAgent",
 *   llm,
 *   workflow: {
 *     name: "DataProcess",
 *     nodes: [
 *       { id: "start", type: "start" },
 *       { id: "extract", type: "llm", config: { prompt: "Extract key info..." } },
 *       { id: "end", type: "end" },
 *     ],
 *     edges: [
 *       { id: "e1", source: "start", target: "extract" },
 *       { id: "e2", source: "extract", target: "end" },
 *     ],
 *   },
 * });
 * ```
 */
export function createWorkflowAgent(config: WorkflowAgentConfig): Agent

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * 创建 Agent (自动选择模式)
 */
export function createAgent(config: AgentConfig & { mode?: AgentMode }): Agent

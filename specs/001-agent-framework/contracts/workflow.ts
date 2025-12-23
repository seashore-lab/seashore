/**
 * @seashore/workflow - 工作流引擎接口契约
 *
 * 支持有向无环图 (DAG) 工作流定义和执行
 * 内置条件分支、并行执行、循环支持
 */

// ============================================================================
// Node Types
// ============================================================================

/**
 * 工作流节点基础接口
 */
export interface WorkflowNodeBase {
  id: string
  type: NodeType
  name?: string
  description?: string
}

/**
 * 节点类型
 */
export type NodeType =
  | 'agent'
  | 'tool'
  | 'llm'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'input'
  | 'output'
  | 'human'
  | 'subworkflow'

/**
 * Agent 节点
 */
export interface AgentNode extends WorkflowNodeBase {
  type: 'agent'
  agentId: string
  prompt?: string
  maxIterations?: number
}

/**
 * Tool 节点
 */
export interface ToolNode extends WorkflowNodeBase {
  type: 'tool'
  toolId: string
  input: Record<string, unknown> | string // 静态值或表达式
}

/**
 * LLM 节点
 */
export interface LLMNode extends WorkflowNodeBase {
  type: 'llm'
  provider: 'openai' | 'anthropic' | 'gemini'
  model: string
  prompt: string
  options?: {
    temperature?: number
    maxTokens?: number
  }
}

/**
 * 条件节点
 */
export interface ConditionNode extends WorkflowNodeBase {
  type: 'condition'
  expression: string // JavaScript 表达式
  branches: {
    condition: string // "true" | "false" | 表达式
    target: string // 目标节点 ID
  }[]
  default?: string // 默认目标节点 ID
}

/**
 * 并行节点
 */
export interface ParallelNode extends WorkflowNodeBase {
  type: 'parallel'
  branches: string[] // 并行执行的节点 ID
  waitAll?: boolean // 是否等待所有分支完成
}

/**
 * 循环节点
 */
export interface LoopNode extends WorkflowNodeBase {
  type: 'loop'
  items: string // 表达式，返回可迭代对象
  body: string // 循环体节点 ID
  maxIterations?: number
}

/**
 * 输入节点 (工作流入口)
 */
export interface InputNode extends WorkflowNodeBase {
  type: 'input'
  schema?: unknown // Zod schema
}

/**
 * 输出节点 (工作流出口)
 */
export interface OutputNode extends WorkflowNodeBase {
  type: 'output'
  value: string // 表达式
}

/**
 * 人工审核节点
 */
export interface HumanNode extends WorkflowNodeBase {
  type: 'human'
  prompt: string
  timeout?: number // 毫秒
  options?: string[] // 预设选项
}

/**
 * 子工作流节点
 */
export interface SubworkflowNode extends WorkflowNodeBase {
  type: 'subworkflow'
  workflowId: string
  input: Record<string, unknown> | string
}

/**
 * 工作流节点联合类型
 */
export type WorkflowNode =
  | AgentNode
  | ToolNode
  | LLMNode
  | ConditionNode
  | ParallelNode
  | LoopNode
  | InputNode
  | OutputNode
  | HumanNode
  | SubworkflowNode

// ============================================================================
// Edge Types
// ============================================================================

/**
 * 工作流边
 */
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string // 可选条件表达式
}

// ============================================================================
// Workflow Definition
// ============================================================================

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  version: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * 工作流定义验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  nodeId?: string
  edgeId?: string
  code: string
  message: string
}

export interface ValidationWarning {
  nodeId?: string
  code: string
  message: string
}

// ============================================================================
// Workflow Execution
// ============================================================================

/**
 * 工作流执行状态
 */
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'waiting_human'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * 节点执行状态
 */
export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

/**
 * 工作流执行实例
 */
export interface WorkflowExecution {
  id: string
  workflowId: string
  status: ExecutionStatus
  input: Record<string, unknown>
  output?: Record<string, unknown>
  variables: Record<string, unknown>
  nodeStates: Record<string, NodeExecutionState>
  error?: string
  startedAt: Date
  completedAt?: Date
  metadata?: Record<string, unknown>
}

/**
 * 节点执行状态
 */
export interface NodeExecutionState {
  nodeId: string
  status: NodeExecutionStatus
  input?: unknown
  output?: unknown
  error?: string
  startedAt?: Date
  completedAt?: Date
  retries?: number
}

// ============================================================================
// Workflow Engine Interface
// ============================================================================

/**
 * 工作流引擎配置
 */
export interface WorkflowEngineConfig {
  /**
   * 存储后端
   */
  storage: unknown // Storage from @seashore/storage

  /**
   * Agent 注册表
   */
  agents?: Record<string, unknown> // Agent from @seashore/agent

  /**
   * Tool 注册表
   */
  tools?: Record<string, unknown> // ServerTool from @seashore/tool

  /**
   * LLM 客户端
   */
  llm?: unknown // LLMClient from @seashore/llm

  /**
   * 最大并发执行数
   */
  maxConcurrency?: number

  /**
   * 节点执行超时 (毫秒)
   */
  nodeTimeout?: number

  /**
   * 重试配置
   */
  retry?: {
    maxRetries: number
    backoff: 'linear' | 'exponential'
    initialDelay: number
  }
}

/**
 * 工作流引擎接口
 */
export interface WorkflowEngine {
  /**
   * 注册工作流定义
   */
  register(definition: WorkflowDefinition): Promise<void>

  /**
   * 获取工作流定义
   */
  get(workflowId: string): Promise<WorkflowDefinition | null>

  /**
   * 验证工作流定义
   */
  validate(definition: WorkflowDefinition): ValidationResult

  /**
   * 执行工作流
   */
  execute(
    workflowId: string,
    input: Record<string, unknown>,
    options?: ExecuteOptions
  ): Promise<WorkflowExecution>

  /**
   * 恢复暂停的执行
   */
  resume(
    executionId: string,
    input?: Record<string, unknown>
  ): Promise<WorkflowExecution>

  /**
   * 暂停执行
   */
  pause(executionId: string): Promise<void>

  /**
   * 取消执行
   */
  cancel(executionId: string): Promise<void>

  /**
   * 获取执行状态
   */
  getExecution(executionId: string): Promise<WorkflowExecution | null>

  /**
   * 列出执行历史
   */
  listExecutions(
    workflowId: string,
    options?: ListExecutionsOptions
  ): Promise<WorkflowExecution[]>

  /**
   * 订阅执行事件
   */
  subscribe(executionId: string, callback: (event: WorkflowEvent) => void): () => void
}

/**
 * 执行选项
 */
export interface ExecuteOptions {
  /**
   * 执行 ID (可选，用于幂等性)
   */
  executionId?: string

  /**
   * 初始变量
   */
  variables?: Record<string, unknown>

  /**
   * 元数据
   */
  metadata?: Record<string, unknown>

  /**
   * 是否同步等待完成
   */
  wait?: boolean

  /**
   * 超时 (毫秒)
   */
  timeout?: number
}

/**
 * 列出执行选项
 */
export interface ListExecutionsOptions {
  status?: ExecutionStatus
  limit?: number
  offset?: number
  orderBy?: 'startedAt' | 'completedAt'
  order?: 'asc' | 'desc'
}

/**
 * 工作流事件
 */
export type WorkflowEvent =
  | { type: 'started'; execution: WorkflowExecution }
  | { type: 'node_started'; nodeId: string; state: NodeExecutionState }
  | { type: 'node_completed'; nodeId: string; state: NodeExecutionState }
  | { type: 'node_failed'; nodeId: string; state: NodeExecutionState }
  | { type: 'waiting_human'; nodeId: string; prompt: string }
  | { type: 'paused'; execution: WorkflowExecution }
  | { type: 'resumed'; execution: WorkflowExecution }
  | { type: 'completed'; execution: WorkflowExecution }
  | { type: 'failed'; execution: WorkflowExecution; error: string }
  | { type: 'cancelled'; execution: WorkflowExecution }

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建工作流引擎
 *
 * @example
 * ```typescript
 * import { createWorkflowEngine } from "@seashore/workflow";
 *
 * const engine = createWorkflowEngine({
 *   storage,
 *   agents: { researcher: researcherAgent },
 *   tools: { search: searchTool },
 *   llm,
 * });
 *
 * // 注册工作流
 * await engine.register({
 *   id: "research-workflow",
 *   name: "Research Workflow",
 *   version: "1.0.0",
 *   nodes: [
 *     { id: "input", type: "input" },
 *     { id: "search", type: "tool", toolId: "search", input: "{{input.query}}" },
 *     { id: "analyze", type: "agent", agentId: "researcher" },
 *     { id: "output", type: "output", value: "{{analyze.result}}" },
 *   ],
 *   edges: [
 *     { id: "e1", source: "input", target: "search" },
 *     { id: "e2", source: "search", target: "analyze" },
 *     { id: "e3", source: "analyze", target: "output" },
 *   ],
 * });
 *
 * // 执行工作流
 * const execution = await engine.execute("research-workflow", {
 *   query: "What is RAG?",
 * });
 * ```
 */
export function createWorkflowEngine(config: WorkflowEngineConfig): WorkflowEngine

// ============================================================================
// Builder API (Fluent Interface)
// ============================================================================

/**
 * 工作流构建器
 */
export interface WorkflowBuilder {
  /**
   * 添加节点
   */
  addNode(node: WorkflowNode): WorkflowBuilder

  /**
   * 添加边
   */
  addEdge(source: string, target: string, condition?: string): WorkflowBuilder

  /**
   * 设置变量
   */
  setVariable(name: string, value: unknown): WorkflowBuilder

  /**
   * 构建工作流定义
   */
  build(): WorkflowDefinition
}

/**
 * 创建工作流构建器
 *
 * @example
 * ```typescript
 * import { defineWorkflow } from "@seashore/workflow";
 *
 * const workflow = defineWorkflow("my-workflow", "My Workflow")
 *   .addNode({ id: "input", type: "input" })
 *   .addNode({ id: "process", type: "llm", provider: "openai", model: "gpt-4", prompt: "..." })
 *   .addNode({ id: "output", type: "output", value: "{{process.result}}" })
 *   .addEdge("input", "process")
 *   .addEdge("process", "output")
 *   .build();
 * ```
 */
export function defineWorkflow(
  id: string,
  name: string,
  version?: string
): WorkflowBuilder

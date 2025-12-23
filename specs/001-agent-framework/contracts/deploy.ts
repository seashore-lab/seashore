/**
 * @seashore/deploy - 部署模块接口契约
 *
 * 提供 Hono 服务器配置
 * 支持 Cloudflare Workers 和 Node.js 适配器
 */

// ============================================================================
// Server Configuration
// ============================================================================

/**
 * 服务器配置
 */
export interface ServerConfig {
  /**
   * 端口 (Node.js)
   */
  port?: number

  /**
   * 主机名 (Node.js)
   */
  hostname?: string

  /**
   * CORS 配置
   */
  cors?: CorsConfig

  /**
   * 日志配置
   */
  logging?: LoggingConfig

  /**
   * 安全配置
   */
  security?: SecurityConfig

  /**
   * 健康检查端点
   */
  healthCheck?: boolean | string
}

/**
 * CORS 配置
 */
export interface CorsConfig {
  origin: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

/**
 * 日志配置
 */
export interface LoggingConfig {
  enabled?: boolean
  level?: 'debug' | 'info' | 'warn' | 'error'
  format?: 'json' | 'pretty'
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  /**
   * API Key 验证
   */
  apiKey?: {
    header: string
    keys: string[] | ((key: string) => Promise<boolean>)
  }

  /**
   * 速率限制
   */
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
}

// ============================================================================
// Chat Endpoint Configuration
// ============================================================================

/**
 * 聊天端点配置
 */
export interface ChatEndpointConfig {
  /**
   * 端点路径
   */
  path?: string

  /**
   * Agent 工厂函数
   */
  agentFactory: (context: RequestContext) => Promise<unknown> // Agent

  /**
   * 请求验证 Schema
   */
  requestSchema?: unknown // Zod schema

  /**
   * 最大输入长度
   */
  maxInputLength?: number

  /**
   * 流式响应
   */
  streaming?: boolean

  /**
   * 存储 (用于线程管理)
   */
  storage?: unknown // Storage

  /**
   * 可观测性
   */
  observability?: unknown // ObservabilityProvider

  /**
   * 安全守卫
   */
  security?: unknown // SecurityGuard
}

/**
 * 请求上下文
 */
export interface RequestContext {
  /**
   * 请求 ID
   */
  requestId: string

  /**
   * 用户 ID (如果认证)
   */
  userId?: string

  /**
   * 线程 ID
   */
  threadId?: string

  /**
   * 请求头
   */
  headers: Record<string, string>

  /**
   * 环境变量
   */
  env: Record<string, string>
}

// ============================================================================
// Hono App Builder
// ============================================================================

/**
 * Seashore App 配置
 */
export interface SeashoreAppConfig extends ServerConfig {
  /**
   * 聊天端点配置
   */
  chat?: ChatEndpointConfig

  /**
   * Agent 配置 (简化版)
   */
  agent?: unknown // AgentConfig

  /**
   * LLM 配置
   */
  llm?: unknown // ProviderConfig

  /**
   * 工具列表
   */
  tools?: unknown[] // ServerTool[]

  /**
   * MCP 服务器配置
   */
  mcp?: unknown // MCPClientConfig

  /**
   * 存储配置
   */
  storage?: unknown // StorageConfig

  /**
   * 可观测性配置
   */
  observability?: unknown // ObservabilityConfig

  /**
   * 安全配置
   */
  securityGuard?: unknown // SecurityGuardConfig
}

/**
 * Seashore Hono App
 */
export interface SeashoreApp {
  /**
   * 底层 Hono 实例
   */
  hono: unknown // Hono

  /**
   * 添加自定义路由
   */
  addRoute(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    handler: unknown // Hono handler
  ): SeashoreApp

  /**
   * 添加中间件
   */
  use(path: string, middleware: unknown): SeashoreApp

  /**
   * 获取 Cloudflare Workers 导出
   */
  toCloudflareWorker(): {
    fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>
  }

  /**
   * 启动 Node.js 服务器
   */
  startNodeServer(port?: number): Promise<void>

  /**
   * 获取处理函数 (用于测试)
   */
  getHandler(): (request: Request) => Promise<Response>
}

// ============================================================================
// Streaming Utilities
// ============================================================================

/**
 * SSE 消息
 */
export interface SSEMessage {
  event?: string
  data: string
  id?: string
  retry?: number
}

/**
 * 创建 SSE 流
 */
export function createSSEStream(
  generator: AsyncGenerator<SSEMessage, void, unknown>
): ReadableStream

/**
 * 创建 Agent 响应流
 *
 * 将 Agent 执行转换为 SSE 流
 */
export function streamAgentResponse(
  agent: unknown, // Agent
  input: string,
  options?: {
    threadId?: string
    onMessage?: (message: unknown) => void
    onToolCall?: (toolCall: unknown) => void
    onError?: (error: Error) => void
  }
): ReadableStream

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建 Seashore App
 *
 * @example
 * ```typescript
 * import { createSeashoreApp } from "@seashore/deploy";
 *
 * const app = createSeashoreApp({
 *   port: 3000,
 *   cors: { origin: "*" },
 *   healthCheck: "/health",
 *
 *   llm: {
 *     provider: "openai",
 *     model: "gpt-4",
 *   },
 *
 *   tools: [searchTool, calculatorTool],
 *
 *   chat: {
 *     path: "/api/chat",
 *     streaming: true,
 *   },
 *
 *   observability: {
 *     serviceName: "my-agent",
 *     logging: { level: "info" },
 *   },
 * });
 *
 * // 添加自定义路由
 * app.addRoute("get", "/api/custom", (c) => c.json({ hello: "world" }));
 *
 * // Cloudflare Workers
 * export default app.toCloudflareWorker();
 *
 * // 或 Node.js
 * app.startNodeServer(3000);
 * ```
 */
export function createSeashoreApp(config: SeashoreAppConfig): SeashoreApp

/**
 * 创建聊天端点处理器
 *
 * 更细粒度的控制
 *
 * @example
 * ```typescript
 * import { Hono } from "hono";
 * import { createChatHandler } from "@seashore/deploy";
 *
 * const app = new Hono();
 *
 * const chatHandler = createChatHandler({
 *   agentFactory: async (ctx) => {
 *     return createReActAgent({
 *       llm: createLLMClient({ provider: "openai", model: "gpt-4" }),
 *       tools: [searchTool],
 *     });
 *   },
 *   streaming: true,
 * });
 *
 * app.post("/api/chat", chatHandler);
 * ```
 */
export function createChatHandler(config: ChatEndpointConfig): unknown // Hono handler

// ============================================================================
// Cloudflare Workers Utilities
// ============================================================================

/**
 * Cloudflare Workers 环境绑定类型
 */
export interface CloudflareEnv {
  // KV
  [key: string]: unknown
}

/**
 * 创建 Cloudflare Workers 兼容的 LLM 客户端
 *
 * 处理 Cloudflare 的 AI 绑定
 */
export function createCloudflareAIClient(
  binding: unknown // Cloudflare AI binding
): unknown // LLMClient

/**
 * 创建 Cloudflare D1 存储适配器
 */
export function createD1StorageAdapter(
  binding: unknown // D1 binding
): unknown // Storage

/**
 * 创建 Cloudflare Vectorize 适配器
 */
export function createVectorizeAdapter(
  binding: unknown // Vectorize binding
): unknown // VectorStore

// ============================================================================
// Node.js Utilities
// ============================================================================

/**
 * 创建 Node.js HTTP 服务器
 */
export function createNodeServer(
  app: SeashoreApp,
  options?: {
    port?: number
    hostname?: string
    onListen?: (info: { port: number; hostname: string }) => void
  }
): Promise<unknown> // Node.js Server

/**
 * 优雅关闭
 */
export function gracefulShutdown(
  server: unknown,
  options?: {
    timeout?: number
    onShutdown?: () => Promise<void>
  }
): void

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * 创建测试客户端
 */
export function createTestClient(app: SeashoreApp): TestClient

/**
 * 测试客户端接口
 */
export interface TestClient {
  /**
   * 发送 GET 请求
   */
  get(path: string, options?: RequestOptions): Promise<TestResponse>

  /**
   * 发送 POST 请求
   */
  post(path: string, body?: unknown, options?: RequestOptions): Promise<TestResponse>

  /**
   * 发送聊天消息
   */
  chat(
    message: string,
    options?: {
      threadId?: string
      streaming?: boolean
    }
  ): Promise<TestChatResponse>
}

/**
 * 请求选项
 */
export interface RequestOptions {
  headers?: Record<string, string>
  query?: Record<string, string>
}

/**
 * 测试响应
 */
export interface TestResponse {
  status: number
  headers: Record<string, string>
  json<T>(): Promise<T>
  text(): Promise<string>
}

/**
 * 测试聊天响应
 */
export interface TestChatResponse {
  messages: unknown[]
  toolCalls: unknown[]
  finalResponse: string
}

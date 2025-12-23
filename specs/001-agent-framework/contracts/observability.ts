/**
 * @seashore/observability - 可观测性接口契约
 *
 * 提供日志、追踪、指标收集
 * 支持 OpenTelemetry 集成
 */

// ============================================================================
// Tracing
// ============================================================================

/**
 * Span 状态
 */
export type SpanStatus = 'unset' | 'ok' | 'error'

/**
 * Span 类型
 */
export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer'

/**
 * Span 属性
 */
export type SpanAttributes = Record<string, string | number | boolean | string[]>

/**
 * Span 事件
 */
export interface SpanEvent {
  name: string
  timestamp: Date
  attributes?: SpanAttributes
}

/**
 * Span 接口
 */
export interface Span {
  /**
   * Span ID
   */
  readonly spanId: string

  /**
   * Trace ID
   */
  readonly traceId: string

  /**
   * 设置属性
   */
  setAttribute(key: string, value: string | number | boolean): Span

  /**
   * 批量设置属性
   */
  setAttributes(attributes: SpanAttributes): Span

  /**
   * 添加事件
   */
  addEvent(name: string, attributes?: SpanAttributes): Span

  /**
   * 设置状态
   */
  setStatus(status: SpanStatus, message?: string): Span

  /**
   * 记录异常
   */
  recordException(error: Error): Span

  /**
   * 结束 Span
   */
  end(): void
}

/**
 * Tracer 接口
 */
export interface Tracer {
  /**
   * 创建 Span
   */
  startSpan(name: string, options?: StartSpanOptions): Span

  /**
   * 在 Span 上下文中执行函数
   */
  withSpan<T>(
    name: string,
    fn: (span: Span) => T | Promise<T>,
    options?: StartSpanOptions
  ): Promise<T>

  /**
   * 获取当前活动 Span
   */
  getActiveSpan(): Span | undefined
}

/**
 * Span 创建选项
 */
export interface StartSpanOptions {
  kind?: SpanKind
  attributes?: SpanAttributes
  parent?: Span
}

// ============================================================================
// Logging
// ============================================================================

/**
 * 日志级别
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  traceId?: string
  spanId?: string
  attributes?: Record<string, unknown>
}

/**
 * Logger 接口
 */
export interface Logger {
  trace(message: string, attributes?: Record<string, unknown>): void
  debug(message: string, attributes?: Record<string, unknown>): void
  info(message: string, attributes?: Record<string, unknown>): void
  warn(message: string, attributes?: Record<string, unknown>): void
  error(message: string, attributes?: Record<string, unknown>): void
  fatal(message: string, attributes?: Record<string, unknown>): void

  /**
   * 创建子 Logger
   */
  child(attributes: Record<string, unknown>): Logger

  /**
   * 设置最小日志级别
   */
  setLevel(level: LogLevel): void
}

// ============================================================================
// Metrics
// ============================================================================

/**
 * 指标类型
 */
export type MetricType = 'counter' | 'gauge' | 'histogram'

/**
 * Counter 指标
 */
export interface Counter {
  /**
   * 增加计数
   */
  add(value: number, attributes?: SpanAttributes): void

  /**
   * 增加 1
   */
  increment(attributes?: SpanAttributes): void
}

/**
 * Gauge 指标
 */
export interface Gauge {
  /**
   * 设置值
   */
  set(value: number, attributes?: SpanAttributes): void
}

/**
 * Histogram 指标
 */
export interface Histogram {
  /**
   * 记录值
   */
  record(value: number, attributes?: SpanAttributes): void
}

/**
 * Metrics 接口
 */
export interface Metrics {
  /**
   * 创建 Counter
   */
  createCounter(name: string, options?: MetricOptions): Counter

  /**
   * 创建 Gauge
   */
  createGauge(name: string, options?: MetricOptions): Gauge

  /**
   * 创建 Histogram
   */
  createHistogram(name: string, options?: HistogramOptions): Histogram
}

/**
 * 指标选项
 */
export interface MetricOptions {
  description?: string
  unit?: string
}

/**
 * Histogram 选项
 */
export interface HistogramOptions extends MetricOptions {
  boundaries?: number[]
}

// ============================================================================
// Seashore-Specific Metrics
// ============================================================================

/**
 * Agent 指标
 */
export interface AgentMetrics {
  /**
   * 请求计数
   */
  requests: Counter

  /**
   * 错误计数
   */
  errors: Counter

  /**
   * 响应延迟
   */
  latency: Histogram

  /**
   * Token 使用量
   */
  tokensUsed: Counter

  /**
   * 工具调用计数
   */
  toolCalls: Counter

  /**
   * 迭代次数
   */
  iterations: Histogram
}

/**
 * LLM 指标
 */
export interface LLMMetrics {
  /**
   * 请求计数
   */
  requests: Counter

  /**
   * 错误计数
   */
  errors: Counter

  /**
   * 延迟
   */
  latency: Histogram

  /**
   * 输入 Token
   */
  inputTokens: Counter

  /**
   * 输出 Token
   */
  outputTokens: Counter

  /**
   * 流式首 Token 延迟
   */
  timeToFirstToken: Histogram
}

/**
 * RAG 指标
 */
export interface RAGMetrics {
  /**
   * 检索计数
   */
  retrievals: Counter

  /**
   * 检索延迟
   */
  retrievalLatency: Histogram

  /**
   * 相关性分数
   */
  relevanceScores: Histogram

  /**
   * 向量搜索延迟
   */
  vectorSearchLatency: Histogram
}

// ============================================================================
// Observability Provider
// ============================================================================

/**
 * 可观测性配置
 */
export interface ObservabilityConfig {
  /**
   * 服务名称
   */
  serviceName: string

  /**
   * 服务版本
   */
  serviceVersion?: string

  /**
   * 环境
   */
  environment?: string

  /**
   * 日志配置
   */
  logging?: LoggingConfig

  /**
   * 追踪配置
   */
  tracing?: TracingConfig

  /**
   * 指标配置
   */
  metrics?: MetricsConfig
}

/**
 * 日志配置
 */
export interface LoggingConfig {
  level: LogLevel
  format?: 'json' | 'pretty'
  output?: 'console' | 'file'
  filePath?: string
}

/**
 * 追踪配置
 */
export interface TracingConfig {
  enabled: boolean
  exporter?: 'console' | 'otlp' | 'jaeger' | 'zipkin'
  endpoint?: string
  sampleRate?: number
}

/**
 * 指标配置
 */
export interface MetricsConfig {
  enabled: boolean
  exporter?: 'console' | 'otlp' | 'prometheus'
  endpoint?: string
  collectInterval?: number
}

/**
 * 可观测性提供者接口
 */
export interface ObservabilityProvider {
  /**
   * 获取 Tracer
   */
  getTracer(name?: string): Tracer

  /**
   * 获取 Logger
   */
  getLogger(name?: string): Logger

  /**
   * 获取 Metrics
   */
  getMetrics(name?: string): Metrics

  /**
   * 获取 Agent 指标
   */
  getAgentMetrics(): AgentMetrics

  /**
   * 获取 LLM 指标
   */
  getLLMMetrics(): LLMMetrics

  /**
   * 获取 RAG 指标
   */
  getRAGMetrics(): RAGMetrics

  /**
   * 关闭并刷新
   */
  shutdown(): Promise<void>
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建可观测性提供者
 *
 * @example
 * ```typescript
 * import { createObservability } from "@seashore/observability";
 *
 * const obs = createObservability({
 *   serviceName: "my-agent",
 *   serviceVersion: "1.0.0",
 *   environment: "production",
 *   logging: {
 *     level: "info",
 *     format: "json",
 *   },
 *   tracing: {
 *     enabled: true,
 *     exporter: "otlp",
 *     endpoint: "http://localhost:4318",
 *   },
 *   metrics: {
 *     enabled: true,
 *     exporter: "prometheus",
 *   },
 * });
 *
 * const logger = obs.getLogger("agent");
 * const tracer = obs.getTracer("agent");
 * const metrics = obs.getAgentMetrics();
 *
 * // 使用追踪
 * await tracer.withSpan("process-request", async (span) => {
 *   span.setAttribute("user.id", userId);
 *
 *   logger.info("Processing request", { userId });
 *   metrics.requests.increment({ endpoint: "/chat" });
 *
 *   const result = await processRequest();
 *
 *   span.setStatus("ok");
 *   return result;
 * });
 * ```
 */
export function createObservability(config: ObservabilityConfig): ObservabilityProvider

// ============================================================================
// Middleware
// ============================================================================

/**
 * 创建 Agent 可观测性中间件
 *
 * 自动追踪 Agent 执行、记录指标
 *
 * @example
 * ```typescript
 * import { createAgentObservabilityMiddleware } from "@seashore/observability";
 *
 * const middleware = createAgentObservabilityMiddleware(obs);
 *
 * const agent = createReActAgent({
 *   llm,
 *   middleware: [middleware],
 * });
 * ```
 */
export function createAgentObservabilityMiddleware(
  provider: ObservabilityProvider
): unknown // AgentMiddleware

/**
 * 创建 Hono 可观测性中间件
 *
 * 自动追踪 HTTP 请求
 *
 * @example
 * ```typescript
 * import { createHonoObservabilityMiddleware } from "@seashore/observability";
 *
 * const app = new Hono();
 * app.use("*", createHonoObservabilityMiddleware(obs));
 * ```
 */
export function createHonoObservabilityMiddleware(
  provider: ObservabilityProvider
): unknown // Hono MiddlewareHandler

// ============================================================================
// Decorators (for class-based usage)
// ============================================================================

/**
 * 追踪装饰器
 *
 * @example
 * ```typescript
 * import { Trace } from "@seashore/observability";
 *
 * class MyService {
 *   @Trace("process")
 *   async process(data: unknown) {
 *     // 自动创建 span
 *   }
 * }
 * ```
 */
export function Trace(name: string): MethodDecorator

/**
 * 日志装饰器
 */
export function Log(level?: LogLevel): MethodDecorator

/**
 * 计时装饰器
 */
export function Timed(metricName: string): MethodDecorator

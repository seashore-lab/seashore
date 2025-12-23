/**
 * @seashore/security - 安全模块接口契约
 *
 * 提供速率限制、输入验证、内容过滤
 * 保护 Agent 免受滥用和恶意输入
 */

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /**
   * 时间窗口 (毫秒)
   */
  windowMs: number

  /**
   * 最大请求数
   */
  maxRequests: number

  /**
   * 基于什么进行限制
   */
  keyBy?: 'ip' | 'user' | 'api_key' | ((request: unknown) => string)

  /**
   * 跳过条件
   */
  skip?: (request: unknown) => boolean

  /**
   * 超限时的响应
   */
  onLimit?: (request: unknown) => unknown

  /**
   * 存储后端
   */
  store?: RateLimitStore
}

/**
 * 速率限制存储接口
 */
export interface RateLimitStore {
  /**
   * 增加计数并返回当前值
   */
  increment(
    key: string,
    windowMs: number
  ): Promise<{
    count: number
    resetTime: Date
  }>

  /**
   * 重置计数
   */
  reset(key: string): Promise<void>
}

/**
 * 速率限制器接口
 */
export interface RateLimiter {
  /**
   * 检查是否允许请求
   */
  check(key: string): Promise<RateLimitResult>

  /**
   * 消费一次配额
   */
  consume(key: string): Promise<RateLimitResult>

  /**
   * 获取剩余配额
   */
  remaining(key: string): Promise<number>

  /**
   * 重置配额
   */
  reset(key: string): Promise<void>
}

/**
 * 速率限制结果
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number // 毫秒
}

// ============================================================================
// Input Validation
// ============================================================================

/**
 * 输入验证配置
 */
export interface InputValidationConfig {
  /**
   * 最大输入长度 (字符)
   */
  maxLength?: number

  /**
   * 最大 Token 数 (估算)
   */
  maxTokens?: number

  /**
   * 禁止的模式 (正则)
   */
  blockedPatterns?: RegExp[]

  /**
   * 允许的字符集
   */
  allowedCharsets?: string[]

  /**
   * 自定义验证器
   */
  customValidators?: InputValidator[]
}

/**
 * 输入验证器
 */
export interface InputValidator {
  name: string
  validate(input: string): ValidationResult
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
  sanitized?: string // 清理后的输入
}

/**
 * 输入验证器接口
 */
export interface InputValidatorService {
  /**
   * 验证输入
   */
  validate(input: string): ValidationResult

  /**
   * 清理输入 (移除危险内容)
   */
  sanitize(input: string): string

  /**
   * 估算 Token 数
   */
  estimateTokens(input: string): number
}

// ============================================================================
// Content Filtering
// ============================================================================

/**
 * 内容过滤配置
 */
export interface ContentFilterConfig {
  /**
   * 过滤级别
   */
  level: 'none' | 'low' | 'medium' | 'high'

  /**
   * 过滤类别
   */
  categories?: ContentCategory[]

  /**
   * 自定义词汇表
   */
  customBlocklist?: string[]

  /**
   * 允许列表 (覆盖封禁)
   */
  allowlist?: string[]

  /**
   * 使用 LLM 进行内容审核
   */
  useLLMModeration?: boolean

  /**
   * LLM 客户端 (如果使用 LLM 审核)
   */
  llm?: unknown // LLMClient
}

/**
 * 内容类别
 */
export type ContentCategory =
  | 'hate'
  | 'harassment'
  | 'self-harm'
  | 'sexual'
  | 'violence'
  | 'illegal'
  | 'pii' // 个人身份信息
  | 'prompt-injection'

/**
 * 内容过滤结果
 */
export interface ContentFilterResult {
  allowed: boolean
  flaggedCategories: ContentCategory[]
  scores: Record<ContentCategory, number>
  filtered?: string // 过滤后的内容
}

/**
 * 内容过滤器接口
 */
export interface ContentFilter {
  /**
   * 过滤输入
   */
  filterInput(content: string): Promise<ContentFilterResult>

  /**
   * 过滤输出
   */
  filterOutput(content: string): Promise<ContentFilterResult>

  /**
   * 检测 Prompt Injection
   */
  detectPromptInjection(content: string): Promise<{
    detected: boolean
    confidence: number
    explanation?: string
  }>

  /**
   * 检测 PII
   */
  detectPII(content: string): Promise<{
    detected: boolean
    entities: PIIEntity[]
  }>

  /**
   * 遮蔽 PII
   */
  maskPII(content: string): Promise<string>
}

/**
 * PII 实体
 */
export interface PIIEntity {
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'name' | 'address' | 'other'
  value: string
  start: number
  end: number
}

// ============================================================================
// Security Guard (Unified Interface)
// ============================================================================

/**
 * 安全守卫配置
 */
export interface SecurityGuardConfig {
  /**
   * 速率限制
   */
  rateLimit?: RateLimitConfig

  /**
   * 输入验证
   */
  inputValidation?: InputValidationConfig

  /**
   * 内容过滤
   */
  contentFilter?: ContentFilterConfig

  /**
   * 是否启用 (便于开发时禁用)
   */
  enabled?: boolean
}

/**
 * 安全检查结果
 */
export interface SecurityCheckResult {
  allowed: boolean
  rateLimitResult?: RateLimitResult
  validationResult?: ValidationResult
  contentFilterResult?: ContentFilterResult
  reason?: string
}

/**
 * 安全守卫接口
 */
export interface SecurityGuard {
  /**
   * 检查请求
   */
  checkRequest(key: string, input: string): Promise<SecurityCheckResult>

  /**
   * 检查输出
   */
  checkOutput(output: string): Promise<ContentFilterResult>

  /**
   * 获取速率限制器
   */
  getRateLimiter(): RateLimiter

  /**
   * 获取输入验证器
   */
  getInputValidator(): InputValidatorService

  /**
   * 获取内容过滤器
   */
  getContentFilter(): ContentFilter
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建速率限制器
 *
 * @example
 * ```typescript
 * import { createRateLimiter } from "@seashore/security";
 *
 * const limiter = createRateLimiter({
 *   windowMs: 60 * 1000, // 1 分钟
 *   maxRequests: 10,
 * });
 *
 * const result = await limiter.consume("user-123");
 * if (!result.allowed) {
 *   throw new Error(`Rate limited. Retry after ${result.retryAfter}ms`);
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter

/**
 * 创建输入验证器
 *
 * @example
 * ```typescript
 * import { createInputValidator } from "@seashore/security";
 *
 * const validator = createInputValidator({
 *   maxLength: 10000,
 *   maxTokens: 4000,
 *   blockedPatterns: [
 *     /ignore previous instructions/i,
 *     /system prompt/i,
 *   ],
 * });
 *
 * const result = validator.validate(userInput);
 * if (!result.valid) {
 *   throw new Error(result.errors.join(", "));
 * }
 * ```
 */
export function createInputValidator(
  config: InputValidationConfig
): InputValidatorService

/**
 * 创建内容过滤器
 *
 * @example
 * ```typescript
 * import { createContentFilter } from "@seashore/security";
 *
 * const filter = createContentFilter({
 *   level: "medium",
 *   categories: ["hate", "harassment", "pii", "prompt-injection"],
 *   useLLMModeration: true,
 *   llm,
 * });
 *
 * const result = await filter.filterInput(userMessage);
 * if (!result.allowed) {
 *   console.log("Blocked categories:", result.flaggedCategories);
 * }
 *
 * // 检测并遮蔽 PII
 * const masked = await filter.maskPII("我的邮箱是 test@example.com");
 * // => "我的邮箱是 [EMAIL]"
 * ```
 */
export function createContentFilter(config: ContentFilterConfig): ContentFilter

/**
 * 创建安全守卫 (统一接口)
 *
 * @example
 * ```typescript
 * import { createSecurityGuard } from "@seashore/security";
 *
 * const guard = createSecurityGuard({
 *   rateLimit: {
 *     windowMs: 60 * 1000,
 *     maxRequests: 10,
 *   },
 *   inputValidation: {
 *     maxLength: 10000,
 *   },
 *   contentFilter: {
 *     level: "medium",
 *   },
 * });
 *
 * // 在 Agent 调用前检查
 * const result = await guard.checkRequest("user-123", userMessage);
 * if (!result.allowed) {
 *   throw new Error(result.reason);
 * }
 *
 * // 处理请求...
 * const response = await agent.chat(userMessage);
 *
 * // 检查输出
 * const outputCheck = await guard.checkOutput(response);
 * if (!outputCheck.allowed) {
 *   return "[内容已被过滤]";
 * }
 * ```
 */
export function createSecurityGuard(config: SecurityGuardConfig): SecurityGuard

// ============================================================================
// Middleware
// ============================================================================

/**
 * 创建 Hono 安全中间件
 *
 * @example
 * ```typescript
 * import { createHonoSecurityMiddleware } from "@seashore/security";
 *
 * const app = new Hono();
 * app.use("/api/*", createHonoSecurityMiddleware(guard));
 * ```
 */
export function createHonoSecurityMiddleware(guard: SecurityGuard): unknown // Hono MiddlewareHandler

/**
 * 创建 Agent 安全中间件
 *
 * @example
 * ```typescript
 * import { createAgentSecurityMiddleware } from "@seashore/security";
 *
 * const middleware = createAgentSecurityMiddleware(guard);
 *
 * const agent = createReActAgent({
 *   llm,
 *   middleware: [middleware],
 * });
 * ```
 */
export function createAgentSecurityMiddleware(guard: SecurityGuard): unknown // AgentMiddleware

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string
  timestamp: Date
  action: string
  userId?: string
  resourceType: string
  resourceId?: string
  input?: unknown
  output?: unknown
  result: 'success' | 'failure' | 'blocked'
  reason?: string
  metadata?: Record<string, unknown>
}

/**
 * 审计日志器接口
 */
export interface AuditLogger {
  /**
   * 记录审计日志
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>

  /**
   * 查询审计日志
   */
  query(options: {
    userId?: string
    action?: string
    resourceType?: string
    startTime?: Date
    endTime?: Date
    limit?: number
  }): Promise<AuditLogEntry[]>
}

/**
 * 创建审计日志器
 */
export function createAuditLogger(storage: unknown): AuditLogger

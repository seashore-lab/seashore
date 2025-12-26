# API Contract: @seashore/tool

**Package**: `@seashore/tool`  
**Version**: 0.1.0

## 概述

Tool 模块提供类型安全的工具定义 API，以及预置的 Serper 和 Firecrawl 工具。

---

## 导出

```typescript
// 核心 API
export { defineTool } from './define-tool'
export type { Tool, ToolConfig, ToolResult } from './types'

// 预置工具
export { serperTool } from './presets/serper'
export { firecrawlTool } from './presets/firecrawl'
```

---

## defineTool

定义一个类型安全的工具。

### 签名

```typescript
function defineTool<TInput extends ZodSchema, TOutput>(
  config: ToolConfig<TInput, TOutput>
): Tool<z.infer<TInput>, TOutput>
```

### 参数

```typescript
interface ToolConfig<TInput extends ZodSchema, TOutput> {
  /** 工具名称 (唯一标识) */
  name: string

  /** 工具描述 (LLM 用于判断何时调用) */
  description: string

  /** 输入参数 schema (Zod) */
  inputSchema: TInput

  /** 执行函数 */
  execute: (input: z.infer<TInput>, context: ToolContext) => Promise<TOutput>

  /** 是否需要用户审批 */
  needsApproval?: boolean // default: false

  /** 执行超时 (毫秒) */
  timeout?: number // default: 30000

  /** 重试配置 */
  retry?: {
    maxAttempts: number
    delay: number
  }
}
```

### 返回值

```typescript
interface Tool<TInput, TOutput> {
  /** 工具名称 */
  readonly name: string

  /** 工具描述 */
  readonly description: string

  /** JSON Schema (用于 LLM) */
  readonly jsonSchema: JsonSchema

  /** 手动执行工具 */
  execute(input: TInput, context?: ToolContext): Promise<ToolResult<TOutput>>

  /** 验证输入 */
  validate(input: unknown): input is TInput
}
```

### 示例

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const calculatorTool = defineTool({
  name: 'calculator',
  description: '执行数学计算',
  inputSchema: z.object({
    expression: z.string().describe('数学表达式，如 "2 + 3 * 4"'),
  }),
  execute: async ({ expression }) => {
    // 安全的表达式求值
    const result = evaluateMathExpression(expression)
    return { result }
  },
})

// 类型完全推断
const result = await calculatorTool.execute({ expression: '2 + 3' })
// result.data 类型为 { result: number }
```

---

## 预置工具

### serperTool

基于 Serper API 的搜索工具。

```typescript
import { serperTool } from '@seashore/tool/presets'

const searchTool = serperTool({
  apiKey: process.env.SERPER_API_KEY!,
  // 可选配置
  country?: string    // 搜索区域，如 'cn'
  locale?: string     // 语言，如 'zh-cn'
  numResults?: number // 返回结果数，default: 10
})
```

**输入 Schema**:

```typescript
z.object({
  query: z.string().describe('搜索查询'),
  type: z.enum(['search', 'news', 'images']).optional(),
})
```

**输出类型**:

```typescript
interface SerperResult {
  organic: Array<{
    title: string
    link: string
    snippet: string
    position: number
  }>
  knowledgeGraph?: {
    title: string
    description: string
  }
}
```

### firecrawlTool

基于 Firecrawl API 的网页抓取工具。

```typescript
import { firecrawlTool } from '@seashore/tool/presets'

const crawlTool = firecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY!,
  // 可选配置
  formats?: ('markdown' | 'html' | 'text')[] // default: ['markdown']
  timeout?: number // 超时毫秒数
})
```

**输入 Schema**:

```typescript
z.object({
  url: z.string().url().describe('要抓取的网页 URL'),
  includeLinks: z.boolean().describe('是否包含页面链接'),
})
```

**输出类型**:

```typescript
interface FirecrawlResult {
  content: string // Markdown 格式的页面内容
  title: string
  links?: string[]
  metadata: {
    sourceUrl: string
    statusCode: number
  }
}
```

---

## ToolContext

工具执行时的上下文信息。

```typescript
interface ToolContext {
  /** 对话线程 ID */
  threadId?: string

  /** 用户 ID */
  userId?: string

  /** 当前 Agent 名称 */
  agentName?: string

  /** 取消信号 */
  signal?: AbortSignal

  /** 追踪器 (可观测性) */
  tracer?: Tracer
}
```

---

## ToolResult

工具执行结果的统一包装。

```typescript
interface ToolResult<T> {
  /** 是否成功 */
  success: boolean

  /** 返回数据 (成功时) */
  data?: T

  /** 错误信息 (失败时) */
  error?: {
    code: string
    message: string
  }

  /** 执行耗时 (毫秒) */
  durationMs: number
}
```

---

## 错误处理

```typescript
import { ToolValidationError, ToolTimeoutError } from '@seashore/tool'

try {
  await myTool.execute(input)
} catch (error) {
  if (error instanceof ToolValidationError) {
    console.log('输入验证失败:', error.issues)
  } else if (error instanceof ToolTimeoutError) {
    console.log('工具执行超时')
  }
}
```

# API Contract: @seashore/observability

**Package**: `@seashore/observability`  
**Version**: 0.1.0

## 概述

Observability 模块提供 Agent 执行追踪、Token 计数和日志记录能力。

---

## 导出

```typescript
// Tracer
export { createTracer, type Tracer, type TracerConfig } from './tracer'

// Token 计数
export { createTokenCounter, type TokenCounter } from './tokens'

// 日志
export { createLogger, type Logger, type LogLevel } from './logger'

// 中间件
export { observabilityMiddleware } from './middleware'

// 类型
export type { Span, SpanContext, TraceEvent, TokenUsage } from './types'
```

---

## Tracer

### createTracer

```typescript
import { createTracer } from '@seashore/observability'

const tracer = createTracer({
  serviceName: 'my-agent-service',

  // 存储后端
  storage: {
    type: 'postgres',
    db: database,
  },

  // 可选：采样率
  samplingRate: 1.0, // 100% 采样

  // 可选：导出器
  exporters: [
    { type: 'console' },
    { type: 'otlp', endpoint: 'http://otel-collector:4318' },
  ],
})
```

### 创建 Span

```typescript
// 手动创建 span
const span = tracer.startSpan('agent.run', {
  attributes: {
    'agent.name': 'my-agent',
    'agent.version': '1.0.0',
  },
})

try {
  const result = await runAgent()
  span.setAttributes({
    'agent.output_length': result.length,
  })
  span.setStatus({ code: 'OK' })
} catch (error) {
  span.setStatus({ code: 'ERROR', message: error.message })
  span.recordException(error)
} finally {
  span.end()
}
```

### 使用 withSpan

```typescript
// 自动管理 span 生命周期
const result = await tracer.withSpan('agent.run', async (span) => {
  span.addEvent('processing_started')

  const llmResult = await tracer.withSpan('llm.generate', async (llmSpan) => {
    const response = await llm.generate(prompt)
    llmSpan.setAttributes({
      'llm.model': 'gpt-4o',
      'llm.prompt_tokens': response.usage.promptTokens,
      'llm.completion_tokens': response.usage.completionTokens,
    })
    return response
  })

  span.addEvent('processing_completed')
  return llmResult
})
```

### 上下文传播

```typescript
// 获取当前上下文
const context = tracer.getActiveContext()

// 在子任务中传播上下文
await Promise.all(
  tasks.map((task) =>
    tracer.withContext(context, () =>
      tracer.withSpan(`task.${task.name}`, async () => {
        await processTask(task)
      })
    )
  )
)
```

---

## Token 计数

### createTokenCounter

```typescript
import { createTokenCounter } from '@seashore/observability'

const counter = createTokenCounter({
  // 默认编码
  defaultEncoding: 'cl100k_base', // GPT-4, GPT-3.5

  // 模型映射
  modelEncodings: {
    'gpt-4o': 'o200k_base',
    'claude-3': 'claude',
  },
})
```

### 计数方法

```typescript
// 计算文本 token 数
const count = counter.count('Hello, world!')
console.log('Tokens:', count)

// 指定模型
const gpt4Count = counter.count('Hello, world!', { model: 'gpt-4o' })

// 计算消息数组的 token
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
]
const messageTokens = counter.countMessages(messages, { model: 'gpt-4o' })

// 估算成本
const cost = counter.estimateCost({
  promptTokens: 1000,
  completionTokens: 500,
  model: 'gpt-4o',
})
console.log('Estimated cost: $', cost.toFixed(4))
```

### 批量计数

```typescript
const texts = ['Text 1', 'Text 2', 'Text 3']
const counts = counter.countBatch(texts)
// [5, 4, 4]

const total = counter.countTotal(texts)
// 13
```

---

## Logger

### createLogger

```typescript
import { createLogger } from '@seashore/observability'

const logger = createLogger({
  name: 'my-agent',
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'

  // 输出格式
  format: 'json', // 'json' | 'pretty'

  // 输出目标
  transports: [{ type: 'console' }, { type: 'file', path: './logs/agent.log' }],

  // 默认上下文
  context: {
    service: 'agent-service',
    environment: process.env.NODE_ENV,
  },
})
```

### 日志方法

```typescript
logger.debug('Debug message', { detail: 'value' })
logger.info('User logged in', { userId: 'user-123' })
logger.warn('Rate limit approaching', { remaining: 10 })
logger.error('Failed to process', { error: err.message, stack: err.stack })
```

### 子 Logger

```typescript
const agentLogger = logger.child({
  component: 'agent',
  agentId: 'agent-123',
})

agentLogger.info('Agent started')
// 自动包含 component 和 agentId
```

---

## Agent 集成

### observabilityMiddleware

为 Agent 添加可观测性：

```typescript
import { createAgent } from '@seashore/agent'
import { observabilityMiddleware } from '@seashore/observability'

const agent = createAgent({
  name: 'observed-agent',
  adapter: openaiText('gpt-4o'),

  middleware: [
    observabilityMiddleware({
      tracer,
      tokenCounter: counter,
      logger,

      // 追踪配置
      tracing: {
        captureInput: true,
        captureOutput: true,
        captureLLMCalls: true,
        captureToolCalls: true,
      },

      // Token 追踪
      tokens: {
        trackUsage: true,
        warnThreshold: 10000,
      },

      // 日志配置
      logging: {
        logLevel: 'info',
        logToolCalls: true,
        logLLMResponses: false, // 可能包含敏感信息
      },
    }),
  ],
})
```

### 手动追踪 Agent 执行

```typescript
import { traceAgentRun } from '@seashore/observability'

const result = await traceAgentRun(tracer, {
  agentName: 'my-agent',
  input: { prompt: 'Hello' },

  run: async (ctx) => {
    ctx.addEvent('custom_event', { data: 'value' })

    const response = await agent.run({ messages })

    ctx.setAttributes({
      'response.length': response.content.length,
    })

    return response
  },
})
```

---

## 查询追踪数据

### 查询 Traces

```typescript
import { createTraceRepository } from '@seashore/storage'

const traceRepo = createTraceRepository(database)

// 查询最近的 traces
const recentTraces = await traceRepo.findRecent({
  limit: 100,
  type: 'agent',
})

// 查询特定 thread 的 traces
const threadTraces = await traceRepo.findByThreadId(threadId, {
  includeChildren: true,
})

// 按时间范围查询
const timeRangeTraces = await traceRepo.findByTimeRange({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  type: 'llm',
})

// 聚合统计
const stats = await traceRepo.getStats({
  groupBy: 'day',
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
})
```

### Token 使用统计

```typescript
// 获取 token 使用汇总
const usage = await traceRepo.getTokenUsage({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  groupBy: 'model',
})

// 结果示例
// {
//   'gpt-4o': { promptTokens: 50000, completionTokens: 20000 },
//   'gpt-4o-mini': { promptTokens: 100000, completionTokens: 40000 },
// }
```

---

## 导出和集成

### OpenTelemetry 导出

```typescript
const tracer = createTracer({
  serviceName: 'my-agent',
  exporters: [
    {
      type: 'otlp',
      endpoint: 'http://otel-collector:4318/v1/traces',
      headers: {
        'x-api-key': process.env.OTEL_API_KEY,
      },
    },
  ],
})
```

### 自定义导出器

```typescript
import { createTracer, type TraceExporter } from '@seashore/observability'

const customExporter: TraceExporter = {
  export: async (spans) => {
    // 发送到自定义后端
    await fetch('https://my-backend.com/traces', {
      method: 'POST',
      body: JSON.stringify(spans),
    })
  },
  shutdown: async () => {
    // 清理资源
  },
}

const tracer = createTracer({
  serviceName: 'my-agent',
  exporters: [customExporter],
})
```

---

## 类型定义

```typescript
export interface Span {
  id: string
  traceId: string
  parentId: string | null
  name: string
  startTime: Date
  endTime: Date | null
  status: SpanStatus
  attributes: Record<string, unknown>
  events: SpanEvent[]
}

export interface SpanStatus {
  code: 'UNSET' | 'OK' | 'ERROR'
  message?: string
}

export interface SpanEvent {
  name: string
  timestamp: Date
  attributes?: Record<string, unknown>
}

export interface SpanContext {
  traceId: string
  spanId: string
  traceFlags: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface TracerConfig {
  serviceName: string
  storage?: {
    type: 'postgres' | 'memory'
    db?: Database
  }
  samplingRate?: number
  exporters?: TraceExporter[]
}

export interface Tracer {
  startSpan(name: string, options?: SpanOptions): Span
  withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>
  getActiveContext(): SpanContext | null
  withContext<T>(context: SpanContext, fn: () => Promise<T>): Promise<T>
}

export interface TokenCounter {
  count(text: string, options?: CountOptions): number
  countMessages(messages: Message[], options?: CountOptions): number
  countBatch(texts: string[]): number[]
  countTotal(texts: string[]): number
  estimateCost(usage: TokenUsage & { model: string }): number
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  child(context: Record<string, unknown>): Logger
}
```

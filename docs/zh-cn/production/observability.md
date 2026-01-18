# 可观测性

Seashore 的可观测性堆栈帮助您理解和操作 Agent 系统：

- 结构化日志记录
- 跨 Agent/LLM/工具调用的追踪跨度
- Token 计数和成本估算
- 导出器（控制台、OTLP）

可运行示例：[examples/09-observability-tracing.md](../examples/09-observability-tracing.md)。

## 后续步骤

- [production/observability/logging.md](./observability/logging.md)
- [production/observability/tracing.md](./observability/tracing.md)
- [production/observability/token-counting.md](./observability/token-counting.md)
- [production/observability/metrics.md](./observability/metrics.md)
# 可观测性

使用全面的可观测性工具（包括日志记录、追踪、Token 计数和指标导出）来监控和追踪您的 AI Agent。

## 概述

可观测性功能：

- **日志记录**：具有多个级别的结构化日志
- **追踪**：跟踪 Agent 执行跨度和性能
- **Token 计数**：监控和估算 Token 使用情况
- **导出器**：将指标导出到各种后端
- **指标**：跟踪自定义指标和 KPI

## 日志记录

### 创建日志记录器

```typescript
import { createLogger } from '@seashorelab/observability'

const logger = createLogger({
  name: 'my-app',
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  format: 'pretty', // 'pretty' | 'json'
})
```

### 记录日志消息

```typescript
logger.debug('Debug message', { data: 'value' })
logger.info('Info message', { userId: '123' })
logger.warn('Warning message', { reason: 'rate limit' })
logger.error('Error message', { error: err.message })
```

### 结构化日志记录

```typescript
logger.info('User action', {
  action: 'login',
  userId: 'user-123',
  timestamp: new Date().toISOString(),
  ip: '192.168.1.1',
  metadata: {
    browser: 'Chrome',
    os: 'macOS',
  },
})
```

### 子日志记录器

```typescript
const agentLogger = logger.child({ component: 'agent' })
const toolLogger = logger.child({ component: 'tool' })

agentLogger.info('Agent started') // 包含 component: 'agent'
toolLogger.info('Tool executed') // 包含 component: 'tool'
```

## 追踪

### 创建追踪器

```typescript
import { createTracer } from '@seashorelab/observability'

const tracer = createTracer({
  serviceName: 'my-ai-service',
  samplingRate: 1.0, // 0.0 到 1.0 (1.0 = 100%)
  exporters: [
    { type: 'console' },
    { type: 'jaeger', endpoint: 'http://localhost:14268/api/traces' },
  ],
})
```

### 创建跨度

```typescript
// 开始一个跨度
const span = tracer.startSpan('agent.run', {
  type: 'agent',
  attributes: {
    'agent.name': 'assistant',
    'input.length': input.length,
  },
})

try {
  // 执行工作
  const result = await agent.run(input)

  // 添加属性
  span.setAttributes({
    'output.length': result.content.length,
    'tool.calls': result.toolCalls.length,
  })

  // 标记成功
  span.setStatus({ code: 'OK' })
} catch (error) {
  // 记录错误
  span.recordException(error)
  span.setStatus({ code: 'ERROR', message: error.message })
  throw error
} finally {
  // 始终结束跨度
  span.end()
}
```

### 嵌套跨度

```typescript
const parentSpan = tracer.startSpan('workflow.execute')

const step1Span = tracer.startSpan('workflow.step1', {
  parent: parentSpan,
})
await executeStep1()
step1Span.end()

const step2Span = tracer.startSpan('workflow.step2', {
  parent: parentSpan,
})
await executeStep2()
step2Span.end()

parentSpan.end()
```

### 自动追踪

自动追踪 Agent 执行：

```typescript
import { withTracing } from '@seashorelab/observability'

const tracedAgent = withTracing(agent, {
  tracer,
  spanName: 'agent.run',
})

// 自动创建跨度
const result = await tracedAgent.run('Hello')
```

## Token 计数

### 创建 Token 计数器

```typescript
import { createTokenCounter } from '@seashorelab/observability'

const counter = createTokenCounter({
  defaultEncoding: 'cl100k_base', // OpenAI 编码
})
```

### 计算 Token

```typescript
const text = 'Hello, how are you?'
const tokens = counter.count(text)
console.log(`Tokens: ${tokens}`)

// 使用特定编码计算
const tokens2 = counter.count(text, { encoding: 'p50k_base' })
```

### 估算成本

```typescript
const usage = {
  promptTokens: 100,
  completionTokens: 50,
}

const cost = counter.estimateCost(usage, {
  model: 'gpt-4o',
  inputPricePerMillion: 5.00,
  outputPricePerMillion: 15.00,
})

console.log(`Cost: $${cost.toFixed(4)}`)
```

### 跟踪使用情况

```typescript
const tracker = counter.createTracker()

tracker.add({ promptTokens: 100, completionTokens: 50 })
tracker.add({ promptTokens: 200, completionTokens: 100 })

const total = tracker.getTotal()
console.log(`Total: ${total.totalTokens} tokens`)
console.log(`Cost: $${tracker.getTotalCost().toFixed(4)}`)
```

## 导出器

### 控制台导出器

```typescript
import { createConsoleExporter } from '@seashorelab/observability'

const exporter = createConsoleExporter({
  format: 'pretty',
})

exporter.export({
  type: 'metric',
  name: 'agent.execution.duration',
  value: 1234,
  unit: 'ms',
  timestamp: new Date(),
})
```

### 自定义导出器

```typescript
import { createExporter } from '@seashorelab/observability'

const customExporter = createExporter({
  name: 'custom-exporter',
  export: async (data) => {
    // 发送到您的监控系统
    await fetch('https://monitoring.example.com/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
})
```

## 指标

### 记录指标

```typescript
import { createMetricsCollector } from '@seashorelab/observability'

const metrics = createMetricsCollector({
  exporters: [consoleExporter],
})

// 计数器
metrics.recordCounter('agent.requests', 1, {
  agent: 'assistant',
  status: 'success',
})

// 直方图
metrics.recordHistogram('agent.duration', 1234, {
  agent: 'assistant',
})

// 仪表
metrics.recordGauge('agent.active_connections', 5)
```

### 自定义指标

```typescript
const requestCounter = metrics.createCounter({
  name: 'http.requests.total',
  description: 'Total HTTP requests',
  unit: 'requests',
})

requestCounter.add(1, { method: 'GET', status: 200 })
```

## 完整的可观测性设置

```typescript
import {
  createLogger,
  createTracer,
  createTokenCounter,
  createMetricsCollector,
  createConsoleExporter,
} from '@seashorelab/observability'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

// 设置可观测性
const logger = createLogger({
  name: 'ai-service',
  level: 'info',
  format: 'json',
})

const tracer = createTracer({
  serviceName: 'ai-service',
  samplingRate: 1.0,
  exporters: [{ type: 'console' }],
})

const tokenCounter = createTokenCounter({
  defaultEncoding: 'cl100k_base',
})

const metrics = createMetricsCollector({
  exporters: [createConsoleExporter()],
})

// 创建 Agent
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are helpful.',
})

// 带可观测性的执行
async function executeWithObservability(input: string) {
  const span = tracer.startSpan('agent.execute', {
    type: 'agent',
    attributes: { 'input.length': input.length },
  })

  logger.info('Starting agent execution', { input })

  const inputTokens = tokenCounter.count(input)
  logger.debug('Token estimation', { inputTokens })

  try {
    const result = await agent.run(input)

    const outputTokens = tokenCounter.count(result.content)
    const totalTokens = inputTokens + outputTokens

    // 记录指标
    metrics.recordCounter('agent.requests', 1, { status: 'success' })
    metrics.recordHistogram('agent.duration', result.durationMs)
    metrics.recordHistogram('agent.tokens', totalTokens)

    // 更新跨度
    span.setAttributes({
      'output.length': result.content.length,
      'tokens.input': inputTokens,
      'tokens.output': outputTokens,
      'tokens.total': totalTokens,
    })
    span.setStatus({ code: 'OK' })

    logger.info('Agent execution completed', {
      durationMs: result.durationMs,
      tokens: totalTokens,
    })

    return result
  } catch (error) {
    metrics.recordCounter('agent.requests', 1, { status: 'error' })
    span.recordException(error)
    span.setStatus({ code: 'ERROR', message: error.message })
    logger.error('Agent execution failed', { error: error.message })
    throw error
  } finally {
    span.end()
  }
}
```

## 最佳实践

1. **结构化日志记录**：始终使用带有上下文的结构化日志
2. **采样**：在生产环境中使用采样以减少开销
3. **敏感数据**：永远不要记录敏感信息（API 密钥、密码）
4. **错误跟踪**：始终记录带有堆栈跟踪的错误
5. **性能**：监控执行时间和 Token 使用情况
6. **告警**：为错误和异常设置告警
7. **仪表板**：为关键指标创建仪表板

## 后续步骤

- [日志记录](./observability/logging.md) - 高级日志记录模式
- [追踪](./observability/tracing.md) - 分布式追踪
- [Token 计数](./observability/token-counting.md) - Token 使用跟踪
- [指标与导出器](./observability/metrics.md) - 自定义指标

## 示例

- [09：可观测性追踪](../examples/09-observability-tracing.md) - 完整的可观测性示例

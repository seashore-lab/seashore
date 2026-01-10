# @seashore/observability

Tracing, token counting, and logging for agent observability.

## Installation

```bash
pnpm add @seashore/observability
```

Required dependencies:
```bash
pnpm add @seashore/storage
```

## Overview

`@seashore/observability` provides:

- Distributed tracing with OpenTelemetry support
- Token counting and cost estimation
- Structured logging
- Agent middleware for automatic tracking
- Query and analysis of trace data

## Quick Start

### Creating a Tracer

```typescript
import { createTracer } from '@seashore/observability'
import { createDatabase } from '@seashore/storage'

const db = createDatabase({ connectionString: process.env.DATABASE_URL })

const tracer = createTracer({
  serviceName: 'my-agent-service',
  storage: {
    type: 'postgres',
    db,
  },
  samplingRate: 1.0, // 100% sampling
  exporters: [
    { type: 'console' },
    { type: 'otlp', endpoint: 'http://otel-collector:4318' },
  ],
})
```

### Creating Spans

```typescript
// Manual span creation
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

### Using withSpan

```typescript
// Automatic span lifecycle
const result = await tracer.withSpan('agent.run', async (span) => {
  span.addEvent('processing_started')

  const llmResult = await tracer.withSpan('llm.generate', async (llmSpan) => {
    const response = await llm.generate(prompt)
    llmSpan.setAttributes({
      'llm.model': 'gpt-4o',
      'llm.prompt_tokens': response.usage.promptTokens,
    })
    return response
  })

  span.addEvent('processing_completed')
  return llmResult
})
```

## API Reference

### createTracer

Creates a tracer instance.

```typescript
function createTracer(config: TracerConfig): Tracer
```

#### Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceName` | `string` | Yes | Service identifier |
| `storage` | `object` | No* | Database storage config |
| `samplingRate` | `number` | No | Trace sampling (0-1, default: 1.0) |
| `exporters` | `TraceExporter[]` | No | Trace exporters |

*Required for persistent storage

### Tracer Methods

#### startSpan()

```typescript
const span = tracer.startSpan(name, {
  attributes?: Record<string, unknown>,
  startTime?: Date,
  links?: SpanLink[],
})
```

#### withSpan()

```typescript
const result = await tracer.withSpan(name, async (span) => {
  // Your code here
  return result
})
```

#### Context Management

```typescript
// Get active context
const context = tracer.getActiveContext()

// Run with context
await tracer.withContext(context, async () => {
  // Code runs with propagated context
})
```

## Token Counting

### createTokenCounter

```typescript
import { createTokenCounter } from '@seashore/observability'

const counter = createTokenCounter({
  defaultEncoding: 'cl100k_base', // GPT-4, GPT-3.5
  modelEncodings: {
    'gpt-4o': 'o200k_base',
    'claude-3': 'claude',
  },
})
```

### Counting Methods

```typescript
// Count text tokens
const count = counter.count('Hello, world!')

// Count for specific model
const gpt4Count = counter.count('Hello, world!', { model: 'gpt-4o' })

// Count messages
const messages = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Hello!' },
]
const messageTokens = counter.countMessages(messages, { model: 'gpt-4o' })

// Estimate cost
const cost = counter.estimateCost({
  promptTokens: 1000,
  completionTokens: 500,
  model: 'gpt-4o',
})
```

### Batch Counting

```typescript
const texts = ['Text 1', 'Text 2', 'Text 3']
const counts = counter.countBatch(texts) // [5, 4, 4]
const total = counter.countTotal(texts) // 13
```

## Logging

### createLogger

```typescript
import { createLogger } from '@seashore/observability'

const logger = createLogger({
  name: 'my-agent',
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  format: 'json', // 'json' | 'pretty'
  transports: [
    { type: 'console' },
    { type: 'file', path: './logs/agent.log' },
  ],
  context: {
    service: 'agent-service',
    environment: process.env.NODE_ENV,
  },
})
```

### Logging Methods

```typescript
logger.debug('Debug message', { detail: 'value' })
logger.info('User logged in', { userId: 'user-123' })
logger.warn('Rate limit approaching', { remaining: 10 })
logger.error('Failed to process', { error: err.message })
```

### Child Logger

```typescript
const agentLogger = logger.child({
  component: 'agent',
  agentId: 'agent-123',
})

agentLogger.info('Agent started')
// Automatically includes component and agentId
```

## Agent Integration

### observabilityMiddleware

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

      tracing: {
        captureInput: true,
        captureOutput: true,
        captureLLMCalls: true,
        captureToolCalls: true,
      },

      tokens: {
        trackUsage: true,
        warnThreshold: 10000,
      },

      logging: {
        logLevel: 'info',
        logToolCalls: true,
        logLLMResponses: false,
      },
    }),
  ],
})
```

### Manual Agent Tracing

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

## Querying Trace Data

### Using Trace Repository

```typescript
import { createTraceRepository } from '@seashore/storage'

const traceRepo = createTraceRepository(database)

// Recent traces
const recentTraces = await traceRepo.findRecent({
  limit: 100,
  type: 'agent',
})

// Thread traces
const threadTraces = await traceRepo.findByThreadId(threadId, {
  includeChildren: true,
})

// Time range
const timeRangeTraces = await traceRepo.findByTimeRange({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  type: 'llm',
})

// Statistics
const stats = await traceRepo.getStats({
  groupBy: 'day',
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
})
```

### Token Usage Statistics

```typescript
const usage = await traceRepo.getTokenUsage({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
  groupBy: 'model',
})

// Result:
// {
//   'gpt-4o': { promptTokens: 50000, completionTokens: 20000 },
//   'gpt-4o-mini': { promptTokens: 100000, completionTokens: 40000 },
// }
```

## Exporters

### OpenTelemetry Export

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

### Custom Exporter

```typescript
import { createTracer, type TraceExporter } from '@seashore/observability'

const customExporter: TraceExporter = {
  export: async (spans) => {
    await fetch('https://my-backend.com/traces', {
      method: 'POST',
      body: JSON.stringify(spans),
    })
  },
  shutdown: async () => {
    // Cleanup
  },
}

const tracer = createTracer({
  serviceName: 'my-agent',
  exporters: [customExporter],
})
```

## Type Definitions

### Span

```typescript
interface Span {
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

interface SpanStatus {
  code: 'UNSET' | 'OK' | 'ERROR'
  message?: string
}

interface SpanEvent {
  name: string
  timestamp: Date
  attributes?: Record<string, unknown>
}
```

### TokenCounter

```typescript
interface TokenCounter {
  count(text: string, options?: CountOptions): number
  countMessages(messages: Message[], options?: CountOptions): number
  countBatch(texts: string[]): number[]
  countTotal(texts: string[]): number
  estimateCost(usage: TokenUsage & { model: string }): number
}
```

### Logger

```typescript
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  child(context: Record<string, unknown>): Logger
}
```

## Best Practices

1. **Use descriptive span names** like 'agent.run', 'llm.generate'
2. **Add attributes** for filtering and analysis
3. **Record events** at key points in execution
4. **Set appropriate sampling** for high-traffic scenarios
5. **Use child loggers** for component-specific context

## See Also

- [Storage Package](storage.md)
- [Agent Package](agent.md)
- [Tracing Guide](../guides/tracing.md)

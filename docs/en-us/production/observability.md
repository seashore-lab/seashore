# Observability

Seashore’s observability stack helps you understand and operate agent systems:

- structured logging
- tracing spans across agent/LLM/tool calls
- token counting and cost estimation
- exporters (console, OTLP)

Runnable example: [examples/09-observability-tracing.md](../examples/09-observability-tracing.md).

## Next steps

- [production/observability/logging.md](./observability/logging.md)
- [production/observability/tracing.md](./observability/tracing.md)
- [production/observability/token-counting.md](./observability/token-counting.md)
- [production/observability/metrics.md](./observability/metrics.md)
# Observability

Monitor and trace your AI agents with comprehensive observability tools including logging, tracing, token counting, and metrics export.

## Overview

Observability features:

- **Logging**: Structured logging with multiple levels
- **Tracing**: Track agent execution spans and performance
- **Token Counting**: Monitor and estimate token usage
- **Exporters**: Export metrics to various backends
- **Metrics**: Track custom metrics and KPIs

## Logging

### Create Logger

```typescript
import { createLogger } from '@seashore/observability'

const logger = createLogger({
  name: 'my-app',
  level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  format: 'pretty', // 'pretty' | 'json'
})
```

### Log Messages

```typescript
logger.debug('Debug message', { data: 'value' })
logger.info('Info message', { userId: '123' })
logger.warn('Warning message', { reason: 'rate limit' })
logger.error('Error message', { error: err.message })
```

### Structured Logging

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

### Child Loggers

```typescript
const agentLogger = logger.child({ component: 'agent' })
const toolLogger = logger.child({ component: 'tool' })

agentLogger.info('Agent started') // Includes component: 'agent'
toolLogger.info('Tool executed') // Includes component: 'tool'
```

## Tracing

### Create Tracer

```typescript
import { createTracer } from '@seashore/observability'

const tracer = createTracer({
  serviceName: 'my-ai-service',
  samplingRate: 1.0, // 0.0 to 1.0 (1.0 = 100%)
  exporters: [
    { type: 'console' },
    { type: 'jaeger', endpoint: 'http://localhost:14268/api/traces' },
  ],
})
```

### Create Spans

```typescript
// Start a span
const span = tracer.startSpan('agent.run', {
  type: 'agent',
  attributes: {
    'agent.name': 'assistant',
    'input.length': input.length,
  },
})

try {
  // Do work
  const result = await agent.run(input)
  
  // Add attributes
  span.setAttributes({
    'output.length': result.content.length,
    'tool.calls': result.toolCalls.length,
  })
  
  // Mark success
  span.setStatus({ code: 'OK' })
} catch (error) {
  // Record error
  span.recordException(error)
  span.setStatus({ code: 'ERROR', message: error.message })
  throw error
} finally {
  // Always end span
  span.end()
}
```

### Nested Spans

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

### Automatic Tracing

Trace agent execution automatically:

```typescript
import { withTracing } from '@seashore/observability'

const tracedAgent = withTracing(agent, {
  tracer,
  spanName: 'agent.run',
})

// Automatically creates spans
const result = await tracedAgent.run('Hello')
```

## Token Counting

### Create Token Counter

```typescript
import { createTokenCounter } from '@seashore/observability'

const counter = createTokenCounter({
  defaultEncoding: 'cl100k_base', // OpenAI encoding
})
```

### Count Tokens

```typescript
const text = 'Hello, how are you?'
const tokens = counter.count(text)
console.log(`Tokens: ${tokens}`)

// Count with specific encoding
const tokens2 = counter.count(text, { encoding: 'p50k_base' })
```

### Estimate Costs

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

### Track Usage

```typescript
const tracker = counter.createTracker()

tracker.add({ promptTokens: 100, completionTokens: 50 })
tracker.add({ promptTokens: 200, completionTokens: 100 })

const total = tracker.getTotal()
console.log(`Total: ${total.totalTokens} tokens`)
console.log(`Cost: $${tracker.getTotalCost().toFixed(4)}`)
```

## Exporters

### Console Exporter

```typescript
import { createConsoleExporter } from '@seashore/observability'

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

### Custom Exporter

```typescript
import { createExporter } from '@seashore/observability'

const customExporter = createExporter({
  name: 'custom-exporter',
  export: async (data) => {
    // Send to your monitoring system
    await fetch('https://monitoring.example.com/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
})
```

## Metrics

### Record Metrics

```typescript
import { createMetricsCollector } from '@seashore/observability'

const metrics = createMetricsCollector({
  exporters: [consoleExporter],
})

// Counter
metrics.recordCounter('agent.requests', 1, {
  agent: 'assistant',
  status: 'success',
})

// Histogram
metrics.recordHistogram('agent.duration', 1234, {
  agent: 'assistant',
})

// Gauge
metrics.recordGauge('agent.active_connections', 5)
```

### Custom Metrics

```typescript
const requestCounter = metrics.createCounter({
  name: 'http.requests.total',
  description: 'Total HTTP requests',
  unit: 'requests',
})

requestCounter.add(1, { method: 'GET', status: 200 })
```

## Complete Observability Setup

```typescript
import {
  createLogger,
  createTracer,
  createTokenCounter,
  createMetricsCollector,
  createConsoleExporter,
} from '@seashore/observability'
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

// Setup observability
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

// Create agent
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are helpful.',
})

// Traced execution
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
    
    // Record metrics
    metrics.recordCounter('agent.requests', 1, { status: 'success' })
    metrics.recordHistogram('agent.duration', result.durationMs)
    metrics.recordHistogram('agent.tokens', totalTokens)
    
    // Update span
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

## Best Practices

1. **Structured Logging**: Always use structured logs with context
2. **Sampling**: Use sampling in production to reduce overhead
3. **Sensitive Data**: Never log sensitive information (API keys, passwords)
4. **Error Tracking**: Always log errors with stack traces
5. **Performance**: Monitor execution time and token usage
6. **Alerts**: Set up alerts for errors and anomalies
7. **Dashboards**: Create dashboards for key metrics

## Next Steps

- [Logging](./observability/logging.md) - Advanced logging patterns
- [Tracing](./observability/tracing.md) - Distributed tracing
- [Token Counting](./observability/token-counting.md) - Token usage tracking
- [Metrics & Exporters](./observability/metrics.md) - Custom metrics

## Examples

- [09: Observability Tracing](../examples/09-observability-tracing.md) - Complete observability example

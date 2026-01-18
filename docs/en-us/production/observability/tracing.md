# Tracing

Tracing records spans for operations like `agent.run`, tool execution, and LLM calls.

## Creating a tracer

```ts
import { createTracer } from '@seashore/observability'

const tracer = createTracer({
  serviceName: 'seashore-example',
  samplingRate: 1.0,
  exporters: [{ type: 'console' }],
})
```

## Manual spans (Example 09 style)

```ts
const span = tracer.startSpan('agent.run', {
  type: 'agent',
  attributes: { 'agent.name': agent.name },
})

try {
  const result = await agent.run(question)
  span.setStatus({ code: 'ok' })
  return result
} catch (err) {
  span.setStatus({ code: 'error', message: String(err) })
  throw err
} finally {
  span.end()
}
```

## Exporters

- `createConsoleExporter()` for local debugging.
- `createOTLPExporter(...)` to send traces to an OpenTelemetry collector.

Always call `await tracer.shutdown()` before process exit.

# 追踪

追踪为 `agent.run`、工具执行和 LLM 调用等操作记录跨度。

## 创建追踪器

```ts
import { createTracer } from '@seashore/observability'

const tracer = createTracer({
  serviceName: 'seashore-example',
  samplingRate: 1.0,
  exporters: [{ type: 'console' }],
})
```

## 手动跨度（示例 09 风格）

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

## 导出器

- `createConsoleExporter()` 用于本地调试。
- `createOTLPExporter(...)` 将追踪发送到 OpenTelemetry 收集器。

始终在进程退出之前调用 `await tracer.shutdown()`。

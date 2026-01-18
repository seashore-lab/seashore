# 示例 09：可观测性追踪

源文件：`examples/src/09-observability-tracing.ts`

## 演示内容

- 使用 `createLogger` 进行结构化日志记录
- 使用 `createTokenCounter` 进行 token 估算
- 在 agent 调用周围使用 `createTracer` 进行手动 span

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/09-observability-tracing.ts
```

## 核心概念

- 可观测性概述：[production/observability.md](../production/observability.md)
- 追踪：[production/observability/tracing.md](../production/observability/tracing.md)
- Token 计数：[production/observability/token-counting.md](../production/observability/token-counting.md)

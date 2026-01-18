# 工具审批

对于敏感工具（网页抓取、shell 执行、支付等），通常需要审批步骤。

Seashore 通过 `@seashorelab/tool` 提供审批包装器和内存审批处理程序。

## 示例（带有审批的 Firecrawl）

这在 [examples/src/11-tool-presets.ts](../../examples/11-tool-presets.md) 中端到端演示。

概念上：

1. 使用 `withApproval(tool, { handler, riskLevel, reason })` 包装工具。
2. 处理程序接收待处理的请求。
3. 批准或拒绝。

## 常见策略

- 对于低风险、只读操作自动批准
- 要求用户批准：
  - 网络抓取
  - 执行 shell 命令
  - 写入磁盘

将其与[安全防护栏](../../production/security.md)结合使用，以降低提示注入风险。

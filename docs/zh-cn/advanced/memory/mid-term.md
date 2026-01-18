# 中期记忆（摘要和整合）

中期记忆是您通过将许多原始消息整合为更少、更高信号的工件来减少 token 增长的地方。

在 Seashore 中，这通常通过以下方式实现：

- 整合工具（去重、分组、摘要）
- 记忆模块中的摘要/事实模式

## 典型工作流程

1. 收集线程的最近短期条目。
2. 定期生成摘要并存储它。
3. 将摘要用作未来提示的"历史"上下文。

## 您可以使用的工具

记忆包导出以下辅助工具：

- `deduplicateMemories`
- `groupByThread`
- `groupByTimeWindow`
- `extractKeyPoints`
- `generateBasicSummary`
- `createConsolidationPipeline`

将这些用作构建块；生产摘要通常涉及 LLM。

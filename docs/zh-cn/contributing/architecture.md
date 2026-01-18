# 架构

Seashore 在 `packages/` 中组织为一组分层的包。

## 包层（典型）

- 基础层：storage、tool
- LLM 层：llm、vectordb
- Agent 层：workflow、agent
- 专用层：rag、memory、security、mcp、observability、evaluation、deploy、genui、contextengineering

## 设计目标

- 与提供商无关的 LLM 适配器
- 类型安全的工具接口（模式驱动）
- 可组合的 agent/工作流构建块
- 面向生产的附加组件（可观测性、评估、安全、部署）

## 代码位置

- Agent 实现：`packages/agent/src/`
- 工作流引擎：`packages/workflow/src/`
- 工具系统：`packages/tool/src/`

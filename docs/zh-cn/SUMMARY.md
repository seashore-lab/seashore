# Seashore 文档

- [主页](./README.md)
- [简介](./introduction.md)
- [快速开始](./quick-start.md)

# 核心概念

- [智能体](./core/agents.md)
  - [ReAct 智能体](./core/agents/react.md)
  - [智能体配置](./core/agents/configuration.md)
  - [流式响应](./core/agents/streaming.md)
  - [错误处理](./core/agents/error-handling.md)

- [工具](./core/tools.md)
  - [定义工具](./core/tools/defining.md)
  - [工具验证](./core/tools/validation.md)
  - [客户端工具](./core/tools/client-tools.md)
  - [工具审批](./core/tools/approval.md)
  - [工具预设](./core/tools/presets.md)

- [LLM 适配器](./core/llm.md)
  - [OpenAI](./core/llm/openai.md)
  - [Anthropic](./core/llm/anthropic.md)
  - [Google Gemini](./core/llm/gemini.md)
  - [嵌入](./core/llm/embeddings.md)
  - [多模态支持](./core/llm/multimodal.md)

- [工作流](./core/workflows.md)
  - [创建工作流](./core/workflows/creating.md)
  - [工作流节点](./core/workflows/nodes.md)
  - [工作流执行](./core/workflows/execution.md)
  - [智能体节点](./core/workflows/agent-nodes.md)

# 高级功能

- [RAG（检索增强生成）](./advanced/rag.md)
  - [文档加载器](./advanced/rag/loaders.md)
  - [文本分割器](./advanced/rag/splitters.md)
  - [检索器](./advanced/rag/retrievers.md)
  - [RAG 管道](./advanced/rag/pipeline.md)

- [内存系统](./advanced/memory.md)
  - [短期内存](./advanced/memory/short-term.md)
  - [中期内存](./advanced/memory/mid-term.md)
  - [长期内存](./advanced/memory/long-term.md)
  - [内存集成](./advanced/memory/integration.md)

- [存储与持久化](./advanced/storage.md)
  - [数据库设置](./advanced/storage/database.md)
  - [会话与消息](./advanced/storage/threads.md)
  - [持久化中间件](./advanced/storage/middleware.md)
  - [会话延续](./advanced/storage/continuation.md)

- [向量数据库](./advanced/vectordb.md)
  - [内存向量存储](./advanced/vectordb/in-memory.md)
  - [混合搜索](./advanced/vectordb/hybrid-search.md)
  - [向量操作](./advanced/vectordb/operations.md)

- [MCP（模型上下文协议）](./advanced/mcp.md)
  - [MCP 客户端](./advanced/mcp/client.md)
  - [工具集成](./advanced/mcp/tools.md)
  - [资源访问](./advanced/mcp/resources.md)

- [上下文工程](./advanced/context-engineering.md)
  - [压缩策略](./advanced/context-engineering/compression.md)
  - [选择性注意](./advanced/context-engineering/selective-attention.md)
  - [上下文管理](./advanced/context-engineering/management.md)

# 生产功能

- [可观测性](./production/observability.md)
  - [日志记录](./production/observability/logging.md)
  - [链路追踪](./production/observability/tracing.md)
  - [令牌计数](./production/observability/token-counting.md)
  - [指标与导出器](./production/observability/metrics.md)

- [评估](./production/evaluation.md)
  - [问答评估](./production/evaluation/qa.md)
  - [自定义评估器](./production/evaluation/custom.md)
  - [评估管道](./production/evaluation/pipelines.md)

- [安全](./production/security.md)
  - [输入防护](./production/security/input-guardrails.md)
  - [输出防护](./production/security/output-guardrails.md)
  - [内容审核](./production/security/moderation.md)
  - [安全策略](./production/security/policies.md)

- [部署](./production/deployment.md)
  - [API 服务器设置](./production/deployment/api-server.md)
  - [Docker 部署](./production/deployment/docker.md)
  - [环境配置](./production/deployment/configuration.md)

- [GenUI（生成式 UI）](./production/genui.md)
  - [React 组件](./production/genui/components.md)
  - [聊天界面](./production/genui/chat.md)
  - [流式 UI](./production/genui/streaming.md)

# 示例

- [概览](./examples/overview.md)
- [01: 基础智能体](./examples/01-basic-agent.md)
- [02: 智能体工具与流](./examples/02-agent-tools-stream.md)
- [03: 基础工作流](./examples/03-basic-workflow.md)
- [04: 基础 RAG](./examples/04-basic-rag.md)
- [05: 基础内存](./examples/05-basic-memory.md)
- [06: 基础 MCP](./examples/06-basic-mcp.md)
- [07: 安全防护](./examples/07-security-guardrails.md)
- [08: 评估问答](./examples/08-evaluation-qa.md)
- [09: 可观测性追踪](./examples/09-observability-tracing.md)
- [10: 部署 API 服务器](./examples/10-deploy-api-server.md)
- [11: 工具预设](./examples/11-tool-presets.md)
- [12: 存储持久化](./examples/12-storage-persistence.md)
- [13: 向量数据库混合搜索](./examples/13-vectordb-hybrid-search.md)
- [14: 上下文工程](./examples/14-context-engineering.md)
- [15: 新建预设工具](./examples/15-new-preset-tools.md)

# API 参考

- [智能体](./api/agent.md)
- [工具](./api/tool.md)
- [LLM](./api/llm.md)
- [工作流](./api/workflow.md)
- [RAG](./api/rag.md)
- [内存](./api/memory.md)
- [存储](./api/storage.md)
- [向量数据库](./api/vectordb.md)
- [MCP](./api/mcp.md)
- [可观测性](./api/observability.md)
- [评估](./api/evaluation.md)
- [安全](./api/security.md)
- [部署](./api/deployment.md)
- [GenUI](./api/genui.md)
- [上下文工程](./api/context-engineering.md)

# 贡献

- [开发设置](./contributing/development.md)
- [架构](./contributing/architecture.md)
- [测试](./contributing/testing.md)
- [文档](./contributing/documentation.md)

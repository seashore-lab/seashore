# Seashore Documentation

- [Home](./README.md)
- [Introduction](./introduction.md)
- [Quick Start](./quick-start.md)

# Core Concepts

- [Agents](./core/agents.md)
  - [ReAct Agents](./core/agents/react.md)
  - [Agent Configuration](./core/agents/configuration.md)
  - [Streaming Responses](./core/agents/streaming.md)
  - [Error Handling](./core/agents/error-handling.md)

- [Tools](./core/tools.md)
  - [Defining Tools](./core/tools/defining.md)
  - [Tool Validation](./core/tools/validation.md)
  - [Client-Side Tools](./core/tools/client-tools.md)
  - [Tool Approval](./core/tools/approval.md)
  - [Tool Presets](./core/tools/presets.md)

- [LLM Adapters](./core/llm.md)
  - [OpenAI](./core/llm/openai.md)
  - [Anthropic](./core/llm/anthropic.md)
  - [Google Gemini](./core/llm/gemini.md)
  - [Embeddings](./core/llm/embeddings.md)
  - [Multimodal Support](./core/llm/multimodal.md)

- [Workflows](./core/workflows.md)
  - [Creating Workflows](./core/workflows/creating.md)
  - [Workflow Nodes](./core/workflows/nodes.md)
  - [Workflow Execution](./core/workflows/execution.md)
  - [Agent Nodes](./core/workflows/agent-nodes.md)

# Advanced Features

- [RAG (Retrieval-Augmented Generation)](./advanced/rag.md)
  - [Document Loaders](./advanced/rag/loaders.md)
  - [Text Splitters](./advanced/rag/splitters.md)
  - [Retrievers](./advanced/rag/retrievers.md)
  - [RAG Pipeline](./advanced/rag/pipeline.md)

- [Memory Systems](./advanced/memory.md)
  - [Short-Term Memory](./advanced/memory/short-term.md)
  - [Mid-Term Memory](./advanced/memory/mid-term.md)
  - [Long-Term Memory](./advanced/memory/long-term.md)
  - [Memory Integration](./advanced/memory/integration.md)

- [Storage & Persistence](./advanced/storage.md)
  - [Database Setup](./advanced/storage/database.md)
  - [Threads & Messages](./advanced/storage/threads.md)
  - [Persistence Middleware](./advanced/storage/middleware.md)
  - [Thread Continuation](./advanced/storage/continuation.md)

- [Vector Databases](./advanced/vectordb.md)
  - [In-Memory Vector Store](./advanced/vectordb/in-memory.md)
  - [Hybrid Search](./advanced/vectordb/hybrid-search.md)
  - [Vector Operations](./advanced/vectordb/operations.md)

- [MCP (Model Context Protocol)](./advanced/mcp.md)
  - [MCP Client](./advanced/mcp/client.md)
  - [Tool Integration](./advanced/mcp/tools.md)
  - [Resource Access](./advanced/mcp/resources.md)

- [Context Engineering](./advanced/context-engineering.md)
  - [Compression Strategies](./advanced/context-engineering/compression.md)
  - [Selective Attention](./advanced/context-engineering/selective-attention.md)
  - [Context Management](./advanced/context-engineering/management.md)

# Production Features

- [Observability](./production/observability.md)
  - [Logging](./production/observability/logging.md)
  - [Tracing](./production/observability/tracing.md)
  - [Token Counting](./production/observability/token-counting.md)
  - [Metrics & Exporters](./production/observability/metrics.md)

- [Evaluation](./production/evaluation.md)
  - [QA Evaluation](./production/evaluation/qa.md)
  - [Custom Evaluators](./production/evaluation/custom.md)
  - [Evaluation Pipelines](./production/evaluation/pipelines.md)

- [Security](./production/security.md)
  - [Input Guardrails](./production/security/input-guardrails.md)
  - [Output Guardrails](./production/security/output-guardrails.md)
  - [Content Moderation](./production/security/moderation.md)
  - [Security Policies](./production/security/policies.md)

- [Deployment](./production/deployment.md)
  - [API Server Setup](./production/deployment/api-server.md)
  - [Docker Deployment](./production/deployment/docker.md)
  - [Environment Configuration](./production/deployment/configuration.md)

- [GenUI (Generative UI)](./production/genui.md)
  - [React Components](./production/genui/components.md)
  - [Chat Interface](./production/genui/chat.md)
  - [Streaming UI](./production/genui/streaming.md)

# Examples

- [Overview](./examples/overview.md)
- [01: Basic Agent](./examples/01-basic-agent.md)
- [02: Agent with Tools and Stream](./examples/02-agent-tools-stream.md)
- [03: Basic Workflow](./examples/03-basic-workflow.md)
- [04: Basic RAG](./examples/04-basic-rag.md)
- [05: Basic Memory](./examples/05-basic-memory.md)
- [06: Basic MCP](./examples/06-basic-mcp.md)
- [07: Security Guardrails](./examples/07-security-guardrails.md)
- [08: Evaluation QA](./examples/08-evaluation-qa.md)
- [09: Observability Tracing](./examples/09-observability-tracing.md)
- [10: Deploy API Server](./examples/10-deploy-api-server.md)
- [11: Tool Presets](./examples/11-tool-presets.md)
- [12: Storage Persistence](./examples/12-storage-persistence.md)
- [13: Vector DB Hybrid Search](./examples/13-vectordb-hybrid-search.md)
- [14: Context Engineering](./examples/14-context-engineering.md)
- [15: New Preset Tools](./examples/15-new-preset-tools.md)

# API Reference

- [Agent](./api/agent.md)
- [Tool](./api/tool.md)
- [LLM](./api/llm.md)
- [Workflow](./api/workflow.md)
- [RAG](./api/rag.md)
- [Memory](./api/memory.md)
- [Storage](./api/storage.md)
- [Vector DB](./api/vectordb.md)
- [MCP](./api/mcp.md)
- [Observability](./api/observability.md)
- [Evaluation](./api/evaluation.md)
- [Security](./api/security.md)
- [Deployment](./api/deployment.md)
- [GenUI](./api/genui.md)
- [Context Engineering](./api/context-engineering.md)

# Contributing

- [Development Setup](./contributing/development.md)
- [Architecture](./contributing/architecture.md)
- [Testing](./contributing/testing.md)
- [Documentation](./contributing/documentation.md)

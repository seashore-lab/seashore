# Data Model: Examples 项目

**Date**: 2025-12-29

## Overview

Examples 项目不涉及持久化数据模型，但需要定义示例的组织结构。

## Entities

### Example

表示一个可运行的示例。

| Field | Type | Description |
|-------|------|-------------|
| id | string | 示例编号，格式 `XX-name` (如 `01-basic-agent`) |
| title | string | 示例标题 |
| description | string | 示例描述 |
| modules | string[] | 涉及的 @seashore/* 模块 |
| priority | P1/P2/P3 | 优先级 |
| requiresEnv | string[] | 必需的环境变量 |

## Examples Catalog

| ID | Title | Modules | Priority | Required Env |
|----|-------|---------|----------|--------------|
| 01-basic-agent | 基础 Agent | agent, llm | P1 | OPENAI_API_KEY |
| 02-agent-with-tools | 带工具的 Agent | agent, llm, tool | P1 | OPENAI_API_KEY |
| 03-streaming-response | 流式响应 | agent, llm | P1 | OPENAI_API_KEY |
| 04-multi-tool-agent | 多工具协作 | agent, llm, tool | P2 | OPENAI_API_KEY, SERPER_API_KEY |
| 05-workflow-basic | 简单工作流 | workflow, llm | P2 | OPENAI_API_KEY |
| 06-rag-knowledge-base | RAG 知识库 | rag, llm | P2 | OPENAI_API_KEY |
| 07-memory-conversation | 带记忆对话 | agent, llm, memory | P2 | OPENAI_API_KEY |
| 08-mcp-filesystem | MCP 文件系统 | agent, llm, mcp | P3 | OPENAI_API_KEY |
| 09-security-guardrails | 安全护栏 | agent, llm, security | P3 | OPENAI_API_KEY |
| 10-evaluation-qa | Agent 评测 | evaluation, llm | P3 | OPENAI_API_KEY |
| 11-observability-tracing | 可观测性追踪 | agent, llm, observability | P3 | OPENAI_API_KEY |
| 12-deploy-api-server | API 服务部署 | agent, llm, deploy | P3 | OPENAI_API_KEY |

## File Structure

```
examples/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── src/
    ├── 01-basic-agent.ts
    ├── 02-agent-with-tools.ts
    ├── 03-streaming-response.ts
    ├── 04-multi-tool-agent.ts
    ├── 05-workflow-basic.ts
    ├── 06-rag-knowledge-base.ts
    ├── 07-memory-conversation.ts
    ├── 08-mcp-filesystem.ts
    ├── 09-security-guardrails.ts
    ├── 10-evaluation-qa.ts
    ├── 11-observability-tracing.ts
    └── 12-deploy-api-server.ts
```

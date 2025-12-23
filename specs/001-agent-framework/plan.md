# Implementation Plan: Seashore Agent Framework

**Branch**: `001-agent-framework` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-agent-framework/spec.md`

## Summary

构建 Seashore Agent Framework —— 一个基于 @tanstack/ai 的 TypeScript Agent 研发框架。框架采用 Monorepo 架构，包含 14 个核心模块（llm、tool、agent、workflow、storage、vectordb、rag、memory、mcp、observability、genui、security、evaluation、deploy），提供从 LLM 调用、Agent 编排、RAG 到可观测性的完整解决方案。

技术核心：

- 底层 AI 能力基于 @tanstack/ai，复用其 Provider Adapter、toolDefinition() 和类型系统
- 数据存储统一使用 PostgreSQL（关系型 + pgvector 向量扩展）
- ORM 使用 Drizzle，支持类型安全的 Schema 定义和查询
- 服务端基于 Hono，优先支持 Cloudflare Workers，兼容传统 Node.js 环境
- 前端基于 React 18，生成式 UI 通过 Tool Call 实现

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)  
**Primary Dependencies**: @tanstack/ai, @tanstack/ai-react, Hono, Drizzle ORM, Zod  
**Storage**: PostgreSQL (关系型 + pgvector 向量扩展 + tsvector 全文搜索)  
**Testing**: vitest (ESM 原生支持)  
**Target Platform**: Cloudflare Workers (主要), Node.js 20+ (兼容)  
**Project Type**: Monorepo (pnpm workspaces + nx)  
**Performance Goals**: Agent 端到端延迟 < 100ms (不含 LLM 时间)  
**Constraints**: ESM Only, 最小化 any, 核心包 < 100KB gzipped  
**Scale/Scope**: 14 个子包，支持 3 种 LLM Provider (OpenAI, Anthropic, Gemini)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原则                | 状态    | 说明                                                             |
| ------------------- | ------- | ---------------------------------------------------------------- |
| I. TanStack AI 优先 | ✅ PASS | 所有 LLM 调用通过 @tanstack/ai 适配器，工具使用 toolDefinition() |
| II. 测试先行        | ✅ PASS | 每个模块配套 vitest 测试，核心逻辑覆盖率 > 80%                   |
| III. 文档驱动验证   | ✅ PASS | 已通过 Context7 查阅 @tanstack/ai、Drizzle、Hono 文档            |
| IV. 前端技术栈      | ✅ PASS | genui 模块使用 React 18 + @tanstack/ai-react                     |
| V. 服务端技术栈     | ✅ PASS | deploy 模块使用 Hono，支持 Cloudflare Workers                    |
| VI. ESM Only        | ✅ PASS | 所有包 package.json 设置 "type": "module"                        |
| VII. 最小化 any     | ✅ PASS | 继承 @tanstack/ai 类型系统，泛型参数透传                         |
| VIII. Monorepo 架构 | ✅ PASS | pnpm + nx + Rollup                                               |
| IX. 架构文档先行    | ✅ PASS | 本文档即架构设计                                                 |
| X. 复用优先         | ✅ PASS | LLM/Tool/Streaming 复用 @tanstack/ai，ORM 使用 Drizzle           |
| XI. 命令验证        | ✅ PASS | 实现时使用 pnpm exec tsc --noEmit 验证                           |
| XII. 模块化设计     | ✅ PASS | 14 个独立包，职责单一，支持 tree-shaking                         |
| XIII. 渐进式复杂度  | ✅ PASS | P1 核心功能 → P2 增强 → P3 集成 → P4 优化                        |

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-framework/
├── plan.md              # 本文件
├── research.md          # Phase 0 技术调研
├── data-model.md        # Phase 1 数据模型设计
├── quickstart.md        # Phase 1 快速入门指南
├── contracts/           # Phase 1 API 契约定义
│   ├── llm.ts           # LLM 模块接口
│   ├── tool.ts          # Tool 模块接口
│   ├── agent.ts         # Agent 模块接口
│   ├── storage.ts       # Storage 模块接口
│   └── ...
└── tasks.md             # Phase 2 任务列表
```

### Source Code (repository root)

```text
packages/
├── llm/                 # @seashore/llm - LLM 适配层
│   ├── src/
│   │   ├── adapters/    # OpenAI/Anthropic/Gemini 适配器包装
│   │   ├── types.ts     # 类型定义
│   │   └── index.ts     # 导出
│   └── tests/
├── tool/                # @seashore/tool - 工具定义与预置工具
│   ├── src/
│   │   ├── define.ts    # 工具定义工厂
│   │   ├── presets/     # 预置工具 (Serper, Firecrawl)
│   │   └── index.ts
│   └── tests/
├── agent/               # @seashore/agent - Agent 核心
│   ├── src/
│   │   ├── react-agent.ts    # Re-Act Agent
│   │   ├── workflow-agent.ts # Workflow Agent
│   │   └── index.ts
│   └── tests/
├── workflow/            # @seashore/workflow - 工作流引擎
│   ├── src/
│   │   ├── graph.ts     # 有向图定义
│   │   ├── executor.ts  # 执行引擎
│   │   └── index.ts
│   └── tests/
├── storage/             # @seashore/storage - 关系型存储
│   ├── src/
│   │   ├── schema/      # Drizzle Schema (Thread, Message)
│   │   ├── repository/  # 数据访问层
│   │   └── index.ts
│   └── tests/
├── vectordb/            # @seashore/vectordb - 向量数据库
│   ├── src/
│   │   ├── pgvector.ts  # PostgreSQL pgvector 实现
│   │   ├── hnsw.ts      # HNSW 索引配置
│   │   └── index.ts
│   └── tests/
├── rag/                 # @seashore/rag - 检索增强
│   ├── src/
│   │   ├── chunker.ts   # 文档分块
│   │   ├── retriever.ts # 检索器 (向量 + 混合)
│   │   ├── hybrid.ts    # 混合检索 (pgvector + tsvector)
│   │   └── index.ts
│   └── tests/
├── memory/              # @seashore/memory - 记忆系统
│   ├── src/
│   │   ├── short-term.ts
│   │   ├── mid-term.ts
│   │   ├── long-term.ts
│   │   └── index.ts
│   └── tests/
├── mcp/                 # @seashore/mcp - MCP 协议
│   ├── src/
│   │   ├── server.ts    # MCP Server
│   │   ├── client.ts    # MCP Client
│   │   └── index.ts
│   └── tests/
├── observability/       # @seashore/observability - 可观测性
│   ├── src/
│   │   ├── tracer.ts    # OpenTelemetry 追踪
│   │   ├── metrics.ts   # 指标收集
│   │   └── index.ts
│   └── tests/
├── genui/               # @seashore/genui - 生成式 UI
│   ├── src/
│   │   ├── components/  # React 组件
│   │   │   ├── ChatUI.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── InputBox.tsx
│   │   │   └── GenUIRenderer.tsx  # Tool Call 驱动的生成式 UI
│   │   ├── hooks/       # React Hooks
│   │   └── index.ts
│   └── tests/
├── security/            # @seashore/security - 安全审查
│   ├── src/
│   │   ├── guardrail.ts # Guardrail 定义
│   │   ├── filters/     # 内容过滤器
│   │   └── index.ts
│   └── tests/
├── evaluation/          # @seashore/evaluation - 评测
│   ├── src/
│   │   ├── dataset.ts   # 数据集定义
│   │   ├── runner.ts    # 评测运行器
│   │   ├── metrics.ts   # 评测指标
│   │   └── index.ts
│   └── tests/
└── deploy/              # @seashore/deploy - 部署
    ├── src/
    │   ├── cloudflare.ts # Cloudflare Workers 适配
    │   ├── node.ts       # Node.js 适配
    │   ├── hono-server.ts # Hono 服务器封装
    │   └── index.ts
    └── tests/
```

**Structure Decision**: 采用 Monorepo 结构，14 个独立包对应 14 个功能模块。每个包遵循统一的目录约定：`src/` 源码、`tests/` 测试。包之间可以有依赖关系（如 agent 依赖 llm、tool），但核心包（llm、tool）应保持独立可用。

## Complexity Tracking

> 本设计符合宪法所有原则，无需记录复杂度例外。

| 项目                     | 说明                                             |
| ------------------------ | ------------------------------------------------ |
| 14 个子包                | 职责单一，符合模块化设计原则                     |
| PostgreSQL 统一存储      | 简化架构，一个数据库同时满足关系型和向量存储需求 |
| 仅支持 3 个 LLM Provider | 符合需求，减少维护成本                           |

## Phase Completion Status

| Phase             | Status    | Artifacts                                                                                      |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------- |
| Phase 0: Research | ✅ 完成   | [research.md](./research.md)                                                                   |
| Phase 1: Design   | ✅ 完成   | [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) |
| Phase 2: Tasks    | ✅ 完成   | [tasks.md](./tasks.md)                                                                        |

### Phase 1 产出物

- **research.md**: @tanstack/ai 使用模式、Drizzle pgvector 集成、Hono SSE 流式传输
- **data-model.md**: 7 个核心实体 (Thread, Message, Memory, Document, Chunk, WorkflowDefinition, WorkflowExecution)
- **contracts/**: 14 个 API 契约文件
  - llm.ts, tool.ts, agent.ts, storage.ts, rag.ts
  - vectordb.ts, workflow.ts, memory.ts, mcp.ts
  - observability.ts, genui.ts, security.ts, evaluation.ts, deploy.ts
- **quickstart.md**: 快速入门指南

### Phase 2 产出物

- **tasks.md**: 完整的任务分解文档
  - 6 个开发阶段 (P0-P6)
  - 166 小时预估工作量
  - 4 条并行开发轨道
  - 任务依赖图和关键路径
  - 风险缓解策略
  - 成功标准定义

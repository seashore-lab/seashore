# Implementation Plan: Agent 研发框架

**Branch**: `001-agent-framework` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-agent-framework/spec.md`

## Summary

构建一个基于 TypeScript 的 Agent 研发框架（Seashore），采用 Monorepo 架构，提供 14 个核心模块：agent、tool、llm、workflow、vectordb、rag、storage、memory、mcp、genui、observability、evaluation、security、deploy。框架底层基于 `@tanstack/ai` 构建，使用 PostgreSQL + Drizzle ORM 实现存储和向量检索，Hono 作为服务端框架，支持 Cloudflare Workers 和传统 Node.js 部署。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+  
**Primary Dependencies**: `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-anthropic`, `@tanstack/ai-gemini`, `hono`, `drizzle-orm`, `zod`  
**Storage**: PostgreSQL with pgvector extension (via Drizzle ORM)  
**Testing**: Vitest  
**Target Platform**: Cloudflare Workers (primary), Node.js (secondary)  
**Project Type**: Monorepo (Nx + pnpm)  
**Performance Goals**: 流式响应首 Token 延迟 ≤ 1.2x 底层 API 延迟；向量检索 p95 < 200ms  
**Constraints**: ESM Only, 最小化 any 使用, 测试覆盖率 80%+  
**Scale/Scope**: 14 个子包，支持 10k 文档规模的 RAG

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原则                      | 状态    | 说明                                 |
| ------------------------- | ------- | ------------------------------------ |
| I. TanStack AI 优先       | ✅ 通过 | 所有 LLM 交互基于 @tanstack/ai       |
| II. 测试即门禁            | ✅ 通过 | 使用 Vitest，每模块完成后测试        |
| III. 文档先行             | ✅ 通过 | 已通过 Context7 研究关键库           |
| IV. React 18 前端         | ✅ 通过 | genui 包使用 React 18                |
| V. Hono 服务端            | ✅ 通过 | deploy 包使用 Hono                   |
| VI. ESM Only              | ✅ 通过 | 所有包设置 type: module              |
| VII. 验证优于猜测         | ✅ 通过 | 已验证 @tanstack/ai 多模态支持       |
| VIII. 类型安全优先        | ✅ 通过 | 使用 Zod schema + 严格 TypeScript    |
| IX. Monorepo 务实主义     | ✅ 通过 | 允许子包互相依赖                     |
| X. 架构文档先于实现       | ✅ 通过 | 本计划即为架构文档                   |
| XI. 工具链统一            | ✅ 通过 | pnpm + Nx + Rollup                   |
| XII. 积极复用 TanStack AI | ✅ 通过 | 复用 chat/generate/toolDefinition 等 |
| XIII. 库优先实现          | ✅ 通过 | Drizzle/Hono/Zod 等成熟库            |

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-framework/
├── plan.md              # 本文件
├── research.md          # Phase 0 技术研究
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 API 契约
│   ├── agent.api.md
│   ├── tool.api.md
│   ├── llm.api.md
│   └── ...
└── tasks.md             # Phase 2 任务列表
```

### Source Code (repository root)

```text
packages/
├── agent/               # 核心 Agent 实现 (ReAct + Workflow)
│   ├── src/
│   │   ├── index.ts
│   │   ├── react-agent.ts
│   │   ├── workflow-agent.ts
│   │   └── types.ts
│   └── __tests__/
├── tool/                # 工具定义与预置工具
│   ├── src/
│   │   ├── index.ts
│   │   ├── define-tool.ts
│   │   ├── presets/
│   │   │   ├── serper.ts
│   │   │   └── firecrawl.ts
│   │   └── types.ts
│   └── __tests__/
├── llm/                 # LLM 适配层 (复用 @tanstack/ai)
│   ├── src/
│   │   ├── index.ts
│   │   ├── adapters.ts   # re-export @tanstack/ai-*
│   │   └── types.ts
│   └── __tests__/
├── workflow/            # 工作流引擎
│   ├── src/
│   │   ├── index.ts
│   │   ├── workflow.ts
│   │   ├── node.ts
│   │   └── types.ts
│   └── __tests__/
├── vectordb/            # 向量数据库 (PostgreSQL + pgvector)
│   ├── src/
│   │   ├── index.ts
│   │   ├── vector-store.ts
│   │   ├── hnsw-index.ts
│   │   └── types.ts
│   └── __tests__/
├── rag/                 # 检索增强
│   ├── src/
│   │   ├── index.ts
│   │   ├── document-loader.ts
│   │   ├── text-splitter.ts
│   │   ├── hybrid-search.ts
│   │   └── types.ts
│   └── __tests__/
├── storage/             # 关系型存储 (Drizzle ORM)
│   ├── src/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   ├── repositories/
│   │   │   ├── thread.ts
│   │   │   ├── message.ts
│   │   │   └── session.ts
│   │   └── types.ts
│   └── __tests__/
├── memory/              # 记忆管理
│   ├── src/
│   │   ├── index.ts
│   │   ├── short-term.ts
│   │   ├── mid-term.ts
│   │   ├── long-term.ts
│   │   └── types.ts
│   └── __tests__/
├── mcp/                 # MCP 协议支持
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── tool-bridge.ts
│   │   └── types.ts
│   └── __tests__/
├── genui/               # 生成式 UI (React)
│   ├── src/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── ChatHistory.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── ToolCallRenderer.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   ├── generative/
│   │   │   ├── GenUIRegistry.ts
│   │   │   └── GenUIRenderer.tsx
│   │   └── types.ts
│   └── __tests__/
├── observability/       # 可观测性
│   ├── src/
│   │   ├── index.ts
│   │   ├── tracer.ts
│   │   ├── token-counter.ts
│   │   └── types.ts
│   └── __tests__/
├── evaluation/          # Agent 评测
│   ├── src/
│   │   ├── index.ts
│   │   ├── evaluator.ts
│   │   ├── metrics/
│   │   │   ├── accuracy.ts
│   │   │   ├── latency.ts
│   │   │   └── relevance.ts
│   │   └── types.ts
│   └── __tests__/
├── security/            # 安全审查
│   ├── src/
│   │   ├── index.ts
│   │   ├── guardrail.ts
│   │   ├── input-filter.ts
│   │   ├── output-filter.ts
│   │   └── types.ts
│   └── __tests__/
└── deploy/              # 部署 (Hono)
    ├── src/
    │   ├── index.ts
    │   ├── server.ts
    │   ├── adapters/
    │   │   ├── cloudflare.ts
    │   │   └── node.ts
    │   └── types.ts
    └── __tests__/
```

**Structure Decision**: 采用 Monorepo 结构，每个功能模块独立为一个子包，通过 Nx 管理依赖关系和构建。子包之间可以互相依赖，核心包（llm、tool、storage）保持相对独立以便复用。

## Complexity Tracking

> 无违规，无需记录

## Module Dependencies

```
                    ┌──────────────────────────────────────┐
                    │              @seashore/agent         │
                    │     (ReAct Agent, Workflow Agent)    │
                    └──────────────────────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          ▼                            ▼                            ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│ @seashore/llm   │          │ @seashore/tool  │          │ @seashore/memory│
│ (LLM Adapters)  │          │ (Tool Defs)     │          │ (Memory Mgmt)   │
└─────────────────┘          └─────────────────┘          └─────────────────┘
          │                            │                            │
          │                            │                            ▼
          ▼                            ▼                  ┌─────────────────┐
┌─────────────────┐          ┌─────────────────┐          │@seashore/storage│
│ @tanstack/ai-*  │          │ Serper/Firecrawl│          │ (Drizzle + PG)  │
│ (OpenAI/Gemini/ │          │ (Preset Tools)  │          └─────────────────┘
│  Anthropic)     │          └─────────────────┘                    │
└─────────────────┘                                                 │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PostgreSQL + pgvector                          │
└─────────────────────────────────────────────────────────────────────────────┘
          ▲                            ▲
          │                            │
┌─────────────────┐          ┌─────────────────┐
│@seashore/vectordb│         │ @seashore/rag   │
│ (Vector Store)   │◄────────│(Hybrid Search)  │
└─────────────────┘          └─────────────────┘

┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│ @seashore/mcp   │          │@seashore/genui  │          │@seashore/deploy │
│ (MCP Client)    │          │ (React UI)      │          │ (Hono Server)   │
└─────────────────┘          └─────────────────┘          └─────────────────┘
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│ MCP Servers     │          │ @tanstack/ai-   │          │ Cloudflare      │
│ (External)      │          │ react (useChat) │          │ Workers / Node  │
└─────────────────┘          └─────────────────┘          └─────────────────┘

┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│@seashore/observe│          │@seashore/eval   │          │@seashore/security│
│ (Tracing)       │          │ (Evaluation)    │          │ (Guardrails)    │
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

## Implementation Phases

### Phase 0: 基础设施 (Foundation)

1. 初始化 Monorepo 结构 (Nx + pnpm)
2. 配置 TypeScript、ESLint、Prettier
3. 配置 Vitest 测试框架
4. 配置 Rollup 打包

### Phase 1: 核心模块 (P1)

1. `@seashore/llm` - LLM 适配层
2. `@seashore/tool` - 工具定义 + Serper/Firecrawl
3. `@seashore/agent` - ReAct Agent

### Phase 2: 数据层 (P2)

1. `@seashore/storage` - Drizzle + PostgreSQL
2. `@seashore/vectordb` - pgvector + HNSW
3. `@seashore/rag` - 混合检索
4. `@seashore/memory` - 记忆管理
5. `@seashore/workflow` - 工作流引擎

### Phase 3: 扩展模块 (P3)

1. `@seashore/mcp` - MCP 协议
2. `@seashore/genui` - React UI
3. `@seashore/observability` - 可观测性
4. `@seashore/evaluation` - 评测
5. `@seashore/security` - Guardrails

### Phase 4: 部署模块 (P4)

1. `@seashore/deploy` - Hono 服务器
2. Cloudflare Workers 适配
3. 传统 Node.js 适配

## Key Technical Decisions

| 决策             | 选择                      | 理由                                        |
| ---------------- | ------------------------- | ------------------------------------------- |
| AI SDK           | @tanstack/ai              | Constitution 要求，类型安全，tree-shakeable |
| LLM Providers    | OpenAI/Gemini/Anthropic   | 用户要求，覆盖主流                          |
| Database         | PostgreSQL + pgvector     | 关系型 + 向量一体化                         |
| ORM              | Drizzle                   | 用户要求，类型安全，轻量                    |
| Vector Index     | HNSW                      | 高性能近似最近邻算法                        |
| Full-text Search | tsvector                  | PostgreSQL 原生，与 pgvector 协同           |
| Server Framework | Hono                      | Constitution 要求，边缘优先                 |
| GenUI 实现       | Tool Call                 | 用户要求，禁止 XML 标签方式                 |
| Deployment       | Cloudflare Workers + Node | 用户要求，兼容 Serverless 和传统            |
| 预置工具         | Serper + Firecrawl        | 用户要求                                    |

## @tanstack/ai 多模态支持情况

| 能力       | 支持状态 | 函数/适配器                                              |
| ---------- | -------- | -------------------------------------------------------- |
| 图片生成   | ✅ 支持  | `generateImage`, `openaiImage`, `geminiImage`            |
| 视频生成   | ✅ 支持  | `generateVideo`, `openaiVideo` (Sora)                    |
| 语音转文字 | ✅ 支持  | `generateTranscription`, `openaiTranscription` (Whisper) |
| 文字转语音 | ✅ 支持  | `generateSpeech`, `openaiTTS`, `geminiSpeech`            |

所有多模态功能均可纳入框架范围。

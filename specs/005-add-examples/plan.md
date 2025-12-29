# Implementation Plan: Examples 可运行示例集

**Branch**: `master` | **Date**: 2025-12-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/master/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

为 Seashore Agent Framework 创建一系列可运行的示例，涵盖从基础 Agent 到高级功能（工作流、RAG、MCP、安全、评测、部署）的完整用例。examples 目录作为独立 npm 项目，使用 pnpm workspace protocol 链接到外层库实现，无需发包即可测试。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >= 20.0.0
**Primary Dependencies**: @seashore/* (workspace packages), @tanstack/ai-openai, zod
**Storage**: N/A (示例中使用内存存储)
**Testing**: 直接运行验证，无需单元测试
**Target Platform**: Node.js CLI, 可选 HTTP 服务器
**Project Type**: single (examples 独立项目)
**Performance Goals**: N/A (示例用途)
**Constraints**: 示例代码简洁易懂，每个示例 < 100 行
**Scale/Scope**: 12 个可运行示例，覆盖 10+ 核心模块

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TanStack AI 优先 | ✅ PASS | 所有示例使用 @tanstack/ai-openai 适配器 |
| II. 测试即门禁 | ⚠️ N/A | 示例代码不需要单元测试，通过运行验证 |
| III. 文档先行 | ✅ PASS | 已阅读 README.md 和各模块文档 |
| IV. React 18 前端 | ⚠️ N/A | 本次示例均为 CLI，不涉及前端 |
| V. Hono 服务端 | ✅ PASS | deploy 示例使用 Hono |
| VI. ESM Only | ✅ PASS | examples 项目设置 type: module |
| VII. 验证优于猜测 | ✅ PASS | 示例代码基于已验证的包导出 |
| VIII. 类型安全优先 | ✅ PASS | TypeScript strict mode |
| IX. Monorepo 务实主义 | ✅ PASS | examples 依赖 workspace packages |
| X. 架构文档先于实现 | ✅ PASS | 先创建 spec/plan 再实现 |
| XI. 工具链统一 | ✅ PASS | 使用 pnpm，通过 workspace protocol 链接 |
| XII. 积极复用 TanStack AI | ✅ PASS | 复用 openaiText, chat 等 |
| XIII. 库优先实现 | ✅ PASS | 使用 @seashore/* 已有功能 |

## Project Structure

### Documentation (this feature)

```text
specs/master/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── contracts/           # Phase 1 output (/speckit.plan command)
```

### Source Code (repository root)

```text
examples/
├── package.json         # 独立 npm 项目，workspace protocol 链接
├── tsconfig.json        # TypeScript 配置
├── .env.example         # 环境变量示例
├── README.md            # Examples 说明文档
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

**Structure Decision**: 选择 Single project 结构，examples 作为独立子项目通过 pnpm workspace 链接到主仓库各包。

## Complexity Tracking

> 无 Constitution Check 违规，无需记录。

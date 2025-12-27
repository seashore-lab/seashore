# Implementation Plan: 修复 TypeScript 代码质量问题

**Branch**: `002-fix-typescript-quality` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-fix-typescript-quality/spec.md`

## Summary

修复 Seashore Agent Framework 中的 TypeScript 类型问题、移除未使用导入和 `.js` 后缀导入，确保所有单元测试通过。这是一个代码质量改进任务，需要处理 14 个包中的类型错误、语法问题和测试失败。

## Technical Context

**Language/Version**: TypeScript 5.x, ESM Only  
**Primary Dependencies**: @tanstack/ai, Zod 4.x, React 18.x, Hono 4.x, Vitest 3.x  
**Storage**: PostgreSQL with Drizzle ORM  
**Testing**: Vitest 3.x with test typechecking enabled  
**Target Platform**: Node.js 20+, Cloudflare Workers  
**Project Type**: Monorepo with 14 packages (pnpm workspace + Nx)  
**Build System**: Rollup 4.x with rollup-plugin-dts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TanStack AI 优先 | ✅ PASS | 不涉及新增 LLM 功能，维持现有架构 |
| II. 测试即门禁 | ✅ PASS | 目标是使所有测试通过 |
| III. 文档先行 | ✅ PASS | 已阅读项目文档和规范 |
| IV. React 18 前端 | ✅ PASS | genui 包已使用 React 18 |
| V. Hono 服务端 | ✅ PASS | deploy 包使用 Hono |
| VI. ESM Only | ✅ PASS | 移除 .js 后缀符合 bundler 模块解析 |
| VII. 验证优于猜测 | ✅ PASS | 使用 tsc 和 vitest 验证修复 |
| VIII. 类型安全优先 | ✅ PASS | 核心目标是修复类型问题 |
| IX. Monorepo 务实主义 | ✅ PASS | 不改变包间依赖 |
| X. 架构文档先于实现 | ✅ PASS | 此 plan.md 即为架构文档 |
| XI. 工具链统一 | ✅ PASS | 使用 pnpm/Nx/Rollup |
| XII. 积极复用 TanStack AI | ✅ PASS | 不涉及新功能 |
| XIII. 库优先实现 | ✅ PASS | 不涉及新功能 |

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-typescript-quality/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
packages/
├── agent/          # ReAct agent implementation
├── deploy/         # Hono-based deployment
├── evaluation/     # Agent evaluation framework
├── genui/          # React generative UI components [JSX issue]
├── llm/            # LLM adapters (OpenAI, Anthropic, etc.)
├── mcp/            # Model Context Protocol client
├── memory/         # Memory management
├── observability/  # Tracing and logging
├── rag/            # Retrieval-augmented generation
├── security/       # Security guardrails
├── storage/        # Drizzle ORM storage layer
├── tool/           # Tool definition and execution [Zod 4 compatibility issue]
├── vectordb/       # Vector database with pgvector
└── workflow/       # Workflow engine
```

## Identified Issues

### Issue Category 1: JSX in .ts Files

**Affected**: `packages/genui/src/renderer.ts`

JSX 语法写在 .ts 文件中导致编译错误。需要将文件重命名为 .tsx 或重构为使用 `createElement`。

### Issue Category 2: Zod 4 Compatibility

**Affected**: `packages/tool/src/zod-to-json-schema.ts`

项目使用 Zod 4.x，但 `zodToJsonSchema` 函数的类型定义基于 Zod 3.x 的内部 API。Zod 4 改变了 `_def` 结构，导致类型检测失败。

### Issue Category 3: .js Import Suffix

**Affected**: 全部 14 个包中约 100+ 处导入

项目使用 `moduleResolution: "bundler"`，不需要 `.js` 后缀。需要批量移除。

### Issue Category 4: Test Failures

**Root Causes**:
1. `zodToJsonSchema` 在 Zod 4 下检测 `ZodObject` 失败
2. 测试中的 unhandled rejection（retry test）
3. node_modules 中的重复测试执行（需要配置 vitest 排除）

## Complexity Tracking

本功能不违反 Constitution，无需记录复杂性偏离。

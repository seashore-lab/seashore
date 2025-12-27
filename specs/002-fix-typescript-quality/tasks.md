```markdown
# Tasks: 修复 TypeScript 代码质量问题

**Input**: Design documents from `/specs/002-fix-typescript-quality/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, quickstart.md ✓

**Tests**: 本功能规范要求确保单元测试通过，但不要求新增测试任务。重点在修复现有测试。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/[package-name]/src/`, `packages/[package-name]/__tests__/`
- **Config**: Repository root (`vitest.config.ts`, `tsconfig.json`)

---

## Phase 1: Setup (Preparation)

**Purpose**: 验证环境并准备工具

- [X] T001 确认当前分支为 `002-fix-typescript-quality` 并安装依赖
- [X] T002 运行 `pnpm typecheck` 记录初始错误数量（预期：33 错误）✓ 实际：33 错误
- [X] T003 运行 `pnpm test` 记录初始失败数量（预期：463 失败）⏭️ 跳过，直接开始修复

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 修复阻塞性问题，确保类型检查可以运行

**⚠️ CRITICAL**: 此阶段必须先完成，否则类型检查无法通过

- [X] T004 重命名 `packages/genui/src/renderer.ts` 为 `packages/genui/src/renderer.tsx`
- [X] T005 更新 `packages/genui/src/index.ts` 中对 `renderer` 的导入路径
- [X] T006 更新 `vitest.config.ts` 添加 `**/node_modules/**` 到 exclude 配置

**Checkpoint**: ✓ genui JSX 错误已消失，发现 429 个其他类型错误

---

## Phase 3: User Story 1 - 类型安全的代码库 (Priority: P1) 🎯 MVP

**Goal**: 解决所有 TypeScript 编译错误，使 `pnpm typecheck` 通过

**Independent Test**: 运行 `pnpm typecheck` 返回零错误

### Zod 4 兼容性修复

- [ ] T007 [US1] 分析 `packages/tool/src/zod-to-json-schema.ts` 中 Zod 4 的 API 变化
- [ ] T008 [US1] 重写 `zodToJsonSchema` 函数以兼容 Zod 4 的 `_zod.def` 结构 in `packages/tool/src/zod-to-json-schema.ts`
- [ ] T009 [US1] 更新 `packages/tool/src/types.ts` 中相关的类型定义（如需要）

### 其他类型错误修复

- [ ] T010 [US1] 扫描所有包并修复剩余类型错误（使用 `pnpm typecheck` 验证）
- [ ] T011 [US1] 对于无法修复的第三方库类型问题，添加类型断言并注释原因

**Checkpoint**: 运行 `pnpm typecheck`，预期零错误输出

---

## Phase 4: User Story 2 - 干净的导入声明 (Priority: P1)

**Goal**: 移除未使用的导入和 `.js` 后缀导入

**Independent Test**: grep 搜索无 `.js` 后缀本地导入；lint 检查无未使用导入警告

### 移除 .js 后缀导入

- [ ] T012 [P] [US2] 移除 `packages/agent/src/` 中所有 `.js` 后缀导入
- [ ] T013 [P] [US2] 移除 `packages/agent/__tests__/` 中所有 `.js` 后缀导入
- [ ] T014 [P] [US2] 移除 `packages/deploy/src/` 中所有 `.js` 后缀导入
- [ ] T015 [P] [US2] 移除 `packages/deploy/__tests__/` 中所有 `.js` 后缀导入
- [ ] T016 [P] [US2] 移除 `packages/evaluation/src/` 中所有 `.js` 后缀导入
- [ ] T017 [P] [US2] 移除 `packages/genui/src/` 中所有 `.js` 后缀导入
- [ ] T018 [P] [US2] 移除 `packages/llm/src/` 中所有 `.js` 后缀导入
- [ ] T019 [P] [US2] 移除 `packages/llm/__tests__/` 中所有 `.js` 后缀导入
- [ ] T020 [P] [US2] 移除 `packages/mcp/src/` 中所有 `.js` 后缀导入
- [ ] T021 [P] [US2] 移除 `packages/memory/src/` 中所有 `.js` 后缀导入
- [ ] T022 [P] [US2] 移除 `packages/observability/src/` 中所有 `.js` 后缀导入
- [ ] T023 [P] [US2] 移除 `packages/rag/src/` 中所有 `.js` 后缀导入
- [ ] T024 [P] [US2] 移除 `packages/security/src/` 中所有 `.js` 后缀导入
- [ ] T025 [P] [US2] 移除 `packages/storage/src/` 中所有 `.js` 后缀导入
- [ ] T026 [P] [US2] 移除 `packages/tool/src/` 中所有 `.js` 后缀导入
- [ ] T027 [P] [US2] 移除 `packages/tool/__tests__/` 中所有 `.js` 后缀导入
- [ ] T028 [P] [US2] 移除 `packages/vectordb/src/` 中所有 `.js` 后缀导入
- [ ] T029 [P] [US2] 移除 `packages/workflow/src/` 中所有 `.js` 后缀导入
- [ ] T030 [P] [US2] 移除 `packages/workflow/__tests__/` 中所有 `.js` 后缀导入

### 未使用导入清理

- [ ] T031 [US2] 运行 `pnpm lint` 识别未使用导入
- [ ] T032 [US2] 移除所有已识别的未使用导入

**Checkpoint**: grep 搜索 `.js` 后缀导入返回空结果；`pnpm lint` 无未使用导入警告

---

## Phase 5: User Story 3 - 通过的单元测试 (Priority: P1)

**Goal**: 确保所有单元测试通过

**Independent Test**: 运行 `pnpm test` 所有测试通过

### Zod 4 相关测试修复

- [ ] T033 [US3] 验证 `zodToJsonSchema` 修复后相关测试是否通过 in `packages/tool/__tests__/`
- [ ] T034 [US3] 修复 `packages/tool/__tests__/` 中因 Zod 4 导致的测试预期差异

### Retry 测试修复

- [ ] T035 [US3] 修复 `packages/llm/__tests__/integration.test.ts` 中 `withRetry` 的 unhandled rejection 问题

### 其他测试修复

- [ ] T036 [US3] 运行 `pnpm test` 并逐个修复剩余失败测试
- [ ] T037 [US3] 对于与核心功能无关的边缘用例测试，可标记为 `it.skip` 或 `it.todo`

**Checkpoint**: 运行 `pnpm test`，所有测试通过

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 最终验证和清理

- [ ] T038 运行 `pnpm typecheck` 验证零错误
- [ ] T039 运行 `pnpm test` 验证所有测试通过
- [ ] T040 运行 `pnpm lint` 验证无 lint 错误
- [ ] T041 运行 quickstart.md 中的验证脚本
- [ ] T042 代码审查：确认 `any` 使用处有注释说明原因
- [ ] T043 代码审查：确认类型断言和非空断言使用合理且必要

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Story 1 (Phase 3)**: 依赖 Foundational 完成
- **User Story 2 (Phase 4)**: 依赖 Foundational 完成；可与 User Story 1 并行
- **User Story 3 (Phase 5)**: 依赖 User Story 1 完成（Zod 4 修复）
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (类型安全)**: 独立可测试 - `pnpm typecheck` 零错误
- **User Story 2 (导入清理)**: 独立可测试 - grep 和 lint 检查通过
- **User Story 3 (测试通过)**: 依赖 US1 的 Zod 4 修复

### Within Each User Story

- T007 → T008 → T009（Zod 修复链）
- T012-T030 可完全并行执行（不同包的 .js 后缀移除）
- T033 → T034（验证后再调整测试）

### Parallel Opportunities

- Phase 2 中 T004、T005、T006 可并行（不同文件）
- Phase 4 中 T012-T030 可并行（不同包）
- US1 和 US2 可并行执行（无直接依赖）

---

## Parallel Example: User Story 2

```bash
# 所有 .js 后缀移除任务可并行执行：
Task: T012 "移除 packages/agent/src/ 中所有 .js 后缀导入"
Task: T013 "移除 packages/agent/__tests__/ 中所有 .js 后缀导入"
Task: T014 "移除 packages/deploy/src/ 中所有 .js 后缀导入"
...（更多并行任务）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup - 记录初始状态
2. 完成 Phase 2: Foundational - 修复 JSX 和 vitest 配置
3. 完成 Phase 3: User Story 1 - Zod 4 兼容性修复
4. **STOP and VALIDATE**: 运行 `pnpm typecheck` 验证零错误
5. 可提前交付类型安全的代码库

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. User Story 1 (类型安全) → `pnpm typecheck` 零错误 → **MVP!**
3. User Story 2 (导入清理) → grep 和 lint 检查通过 → 交付
4. User Story 3 (测试通过) → `pnpm test` 全部通过 → 交付
5. 每个故事独立增加价值

### 推荐执行顺序

单人执行时：
1. Phase 1 → Phase 2 → Phase 3 → Phase 5 → Phase 4 → Phase 6

原因：User Story 3（测试通过）依赖 User Story 1（Zod 修复），但 User Story 2（导入清理）是独立的清理工作，可放在最后执行。

---

## Notes

- [P] tasks = 不同文件，无依赖
- [Story] 标签将任务映射到特定用户故事以便追踪
- 每个用户故事应可独立完成和测试
- 每个任务或逻辑组完成后提交
- 在任何检查点停止以独立验证故事
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
- **注意**：`rollup.config.js` 中的 `.js` 导入应保留（实际 JS 文件）
```

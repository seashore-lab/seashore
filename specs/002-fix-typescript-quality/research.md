# Research: 修复 TypeScript 代码质量问题

**Created**: 2025-12-27  
**Status**: Complete

## Research Questions

### RQ-1: Zod 4 与 Zod 3 的 API 差异

**问题**: `zodToJsonSchema` 函数无法正确识别 Zod 4 的 `ZodObject` 类型

**发现**:
- Zod 4 重构了内部 `_def` 结构
- Zod 4 中 `typeName` 属性移动到了不同位置
- Zod 4 使用 `_zod.def` 而非 `_def.typeName`

**决策**: 重写 `zodToJsonSchema` 函数以兼容 Zod 4 的新 API
- 使用 `schema._zod?.def?.type` 检测类型
- 或使用 `zod` 提供的官方 type guards（如果可用）

**替代方案考虑**:
- 使用 `zod-to-json-schema` 第三方库 - 但增加额外依赖
- 降级到 Zod 3 - 与项目 pnpm.overrides 冲突

### RQ-2: JSX 文件扩展名

**问题**: `packages/genui/src/renderer.ts` 包含 JSX 语法但使用 .ts 扩展名

**发现**:
- TypeScript 编译器需要 .tsx 扩展名来解析 JSX
- 虽然 tsconfig 有 `"jsx": "react-jsx"`，但这只影响如何转换 JSX，不影响是否解析 JSX
- .ts 文件中的 `<` 被解析为比较运算符而非 JSX 标签

**决策**: 将包含 JSX 的 .ts 文件重命名为 .tsx
- `renderer.ts` → `renderer.tsx`
- 更新所有导入该文件的地方

**替代方案考虑**:
- 使用 `React.createElement` 替代 JSX - 代码可读性差，维护困难

### RQ-3: .js 后缀导入

**问题**: 项目中约 100+ 处使用 `.js` 后缀导入本地 TypeScript 文件

**发现**:
- 项目使用 `moduleResolution: "bundler"`
- bundler 模式下，TypeScript 自动解析无后缀或 .ts 后缀的导入
- `.js` 后缀在某些边缘情况可能导致问题

**决策**: 批量移除所有本地 `.js` 后缀导入
- 使用 sed/find-replace 批量处理
- 保留 node_modules 中的 .js 导入（第三方库）

**排除范围**:
- `rollup.config.js` 中的 `rollup.config.base.js` 导入 - 这是实际的 JS 文件

### RQ-4: Vitest 配置问题

**问题**: 测试在 `node_modules` 子包中重复运行

**发现**:
- vitest 的 `include` 模式 `packages/**/__tests__/**/*.test.ts` 匹配了 node_modules 中的测试
- 每个包的 node_modules 中有依赖包的源码和测试（workspace 链接）

**决策**: 更新 vitest.config.ts 的 exclude 模式
- 添加 `**/node_modules/**` 到 exclude

### RQ-5: Retry Test Unhandled Rejection

**问题**: `withRetry` 测试产生 unhandled rejection

**发现**:
- 测试中 `vi.fn().mockRejectedValue(new Error('Rate limit'))` 产生的 rejection 未被正确捕获
- 可能是 `expect().rejects` 的时序问题

**决策**: 修复测试中的异步错误处理
- 使用 `await expect(...).rejects.toThrow()` 正确模式
- 或调整 mock 实现

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| 重写 zodToJsonSchema 兼容 Zod 4 | 项目已锁定 Zod 4，需要适配新 API | 使用第三方库（增加依赖）|
| 重命名 JSX 文件为 .tsx | TypeScript 标准做法 | 使用 createElement（可读性差）|
| 移除 .js 后缀 | bundler 模式不需要，保持一致性 | 保留（可能有边缘问题）|
| 排除 node_modules 测试 | 避免重复运行依赖包的测试 | 无 |

## Implementation Priority

1. **P0 - Blocking**: 修复 genui/renderer.ts JSX 语法错误（阻塞类型检查）
2. **P1 - Core**: 修复 tool/zod-to-json-schema.ts Zod 4 兼容性（核心功能）
3. **P2 - Cleanup**: 移除 .js 后缀导入（代码清理）
4. **P3 - Tests**: 修复测试配置和失败用例

## Files to Modify

### High Priority (Type Errors)

- `packages/genui/src/renderer.ts` → 重命名为 .tsx
- `packages/tool/src/zod-to-json-schema.ts` → Zod 4 兼容
- `packages/tool/src/types.ts` → 可能需要更新类型定义

### Medium Priority (.js Suffix)

所有包的 `src/` 和 `__tests__/` 目录中的 `.js` 后缀导入（约 100+ 处）

### Configuration

- `vitest.config.ts` → 排除 node_modules
- `packages/genui/src/index.ts` → 更新 renderer 导入路径

### Tests

- `packages/llm/__tests__/integration.test.ts` → 修复 retry 测试
- `packages/tool/__tests__/schema.test.ts` → 调整测试预期适配 Zod 4

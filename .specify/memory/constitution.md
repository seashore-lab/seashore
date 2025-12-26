<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (Initial ratification)
Modified principles: N/A (initial version)
Added sections:
  - Core Principles (13 principles)
  - Technology Stack
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (compatible, no changes needed)
  - .specify/templates/spec-template.md ✅ (compatible, no changes needed)
  - .specify/templates/tasks-template.md ✅ (compatible, no changes needed)
Follow-up TODOs: None
-->

# Seashore Constitution

> AI 工具链 Monorepo 项目的核心治理原则与开发规范

## Core Principles

### I. TanStack AI 优先

**规则**: 项目底层 AI 能力 MUST 基于 `@tanstack/ai` 构建，禁止使用 Vercel AI SDK 或其他替代方案。

**理由**:

- `@tanstack/ai` 提供类型安全、tree-shakeable 的适配器架构
- 统一的跨 Provider 接口（OpenAI、Anthropic、Ollama、Gemini）避免厂商锁定
- 与 TanStack 生态系统（Router、Query、Store）深度集成

**执行要求**:

- 所有 LLM 交互 MUST 通过 `@tanstack/ai` 的 `chat()`, `generate()`, `embedding()` 等核心函数
- 适配器 MUST 使用细粒度导入（如 `openaiText`, `anthropicText`）而非废弃的单体适配器
- 工具定义 MUST 使用 `toolDefinition()` 配合 Zod schema

### II. 测试即门禁

**规则**: 每个模块完成后 MUST 通过 Vitest 单元测试，测试失败阻断后续开发。

**理由**:

- 避免错误向下游扩散，降低调试成本
- 确保模块边界清晰、接口稳定
- 为重构提供安全网

**执行要求**:

- 每个 `packages/*` 子包 MUST 包含 `__tests__/` 目录或 `*.test.ts` 文件
- 测试覆盖率 SHOULD 达到关键路径 80%+
- PR 合并前 MUST 通过 `pnpm test` 全量测试
- 使用 `vitest` 作为测试框架，禁止使用 Jest

### III. 文档先行

**规则**: 如果对任何库不了解，MUST 先使用 Context7 充分阅读官方文档再动手实现。

**理由**:

- 减少因误解 API 导致的返工
- 确保使用最新的最佳实践
- 避免重复造轮子

**执行要求**:

- 引入新依赖前 MUST 查阅其官方文档
- 遇到库行为疑惑时 SHOULD 先验证再假设
- 架构设计 SHOULD 参考库的推荐模式

### IV. React 18 前端

**规则**: 所有前端开发 MUST 使用 React 18，采用现代并发特性。

**理由**:

- React 18 的并发渲染、Suspense、useTransition 提升用户体验
- 与 TanStack Router、TanStack Query 等生态兼容
- 社区支持成熟，文档丰富

**执行要求**:

- 前端子包 MUST 指定 `react` 和 `react-dom` 版本 `^18.x`
- SHOULD 使用函数式组件和 Hooks
- MUST 支持 Strict Mode

### V. Hono 服务端

**规则**: 所有服务端开发 MUST 使用 Hono 框架。

**理由**:

- Hono 轻量、快速、边缘优先
- 原生支持 TypeScript 和 ESM
- 与 Cloudflare Workers、Deno Deploy、Bun 等运行时兼容

**执行要求**:

- 服务端子包 MUST 使用 `hono` 作为 HTTP 框架
- API 路由 MUST 遵循 RESTful 或 RPC 风格一致性
- 中间件 SHOULD 复用 Hono 生态组件

### VI. ESM Only

**规则**: 所有产物 MUST 仅输出 ESM 格式，禁止 CommonJS 兼容考量。

**理由**:

- ESM 是 JavaScript 标准模块系统
- Tree-shaking 仅对 ESM 有效
- 简化打包配置，减少双格式维护成本

**执行要求**:

- 所有 `package.json` MUST 设置 `"type": "module"`
- 打包产物 MUST 仅输出 `.js` (ESM) 或 `.mjs`
- 禁止使用 `require()` 和 `module.exports`
- tsconfig MUST 设置 `"module": "ESNext"` 或 `"NodeNext"`

### VII. 验证优于猜测

**规则**: 对于模块导出和 API 接口，MUST 使用命令验证实际行为，禁止猜测和编造。

**理由**:

- 减少幻觉导致的代码错误
- 确保代码引用真实存在的导出
- 提高调试效率

**执行要求**:

- 引用外部模块导出前 SHOULD 运行类型检查或导入验证
- API 对接时 MUST 参考实际响应结构
- 使用 `pnpm exec tsc --noEmit` 验证类型

### VIII. 类型安全优先

**规则**: TypeScript 编程中 MUST 最小化 `any` 的使用，尽力继承 `@tanstack/ai` 的类型安全。

**理由**:

- `any` 绕过类型检查，埋下运行时隐患
- `@tanstack/ai` 提供丰富的泛型和类型推断
- 强类型提升 IDE 补全和重构体验

**执行要求**:

- tsconfig MUST 启用 `"strict": true`
- 禁止使用 `any`，必要时使用 `unknown` 并收窄
- 工具定义 MUST 使用 Zod schema 配合 `z.infer<>` 获取类型
- 使用 `@typescript-eslint/no-explicit-any` 规则强制约束

### IX. Monorepo 务实主义

**规则**: 对于 Monorepo 项目，不强求所有子包都可单独使用。

**理由**:

- 过度追求独立性增加维护成本
- 部分子包天然存在依赖关系
- 聚焦于整体产品价值而非模块纯粹性

**执行要求**:

- 子包 MAY 依赖同 workspace 内的其他包
- 核心公共包（如 `@seashore/llm`）SHOULD 保持独立可用
- 依赖关系 MUST 在 `package.json` 中显式声明

### X. 架构文档先于实现

**规则**: 在实现之前，MUST 把计划写成具体的架构文档，以便过程中随时查询，避免遗忘。

**理由**:

- 降低复杂功能实现中的认知负担
- 便于团队协作和代码审查
- 为后续维护提供参考

**执行要求**:

- 新功能开发前 MUST 在 `.specify/specs/` 或 `docs/` 创建设计文档
- 文档 MUST 包含目标、技术方案、关键决策
- 实现过程中 SHOULD 持续更新文档

### XI. 工具链统一

**规则**:

- 包管理器 MUST 使用 pnpm，禁止 npm/npx 命令
- Monorepo 管理 MUST 使用 Nx
- 库打包 MUST 使用 Rollup

**理由**:

- pnpm 高效的磁盘利用和严格的依赖隔离
- Nx 提供任务编排、缓存、依赖图分析
- Rollup 专注于库打包，tree-shaking 效果最佳

**执行要求**:

- 项目根目录 MUST 使用 `pnpm-workspace.yaml`
- 命令一律使用 `pnpm` 替代 `npm`，如 `pnpm install`, `pnpm add`, `pnpm exec`
- 子包构建 MUST 配置 `rollup.config.js` 或 Nx 的 rollup executor
- CI 流程 MUST 使用 `pnpm` 和 `nx run-many`

### XII. 积极复用 TanStack AI

**规则**: 能复用 `@tanstack/ai` 已有的功能，MUST 积极复用，禁止自己造轮子。

**理由**:

- `@tanstack/ai` 提供经过测试的通用能力
- 减少维护负担，受益于上游更新
- 保持与生态的兼容性

**执行要求**:

- 实现前 MUST 检查 `@tanstack/ai` 是否已提供类似功能
- 流式响应 MUST 使用 `toStreamResponse()` 或 `toServerSentEventsStream()`
- 工具管理 MUST 使用 `ToolCallManager`
- 消息类型 MUST 使用 `InferChatMessages<>` 等类型工具

### XIII. 库优先实现

**规则**: 具有一定复杂度的功能，能调库实现的，MUST 积极复用成熟库，禁止自己造轮子。

**理由**:

- 成熟库经过社区验证，可靠性高
- 减少开发时间和潜在 bug
- 便于获取社区支持

**执行要求**:

- 通用功能（如日期处理、验证、解析）MUST 优先使用成熟库
- 引入新库前 SHOULD 评估维护状态、下载量、类型支持
- 避免为简单需求引入过重的依赖

## Technology Stack

| 领域          | 技术选型                                                       | 版本要求 |
| ------------- | -------------------------------------------------------------- | -------- |
| AI SDK        | `@tanstack/ai`, `@tanstack/ai-react`, `@tanstack/ai-openai` 等 | latest   |
| 前端框架      | React                                                          | ^18.x    |
| 服务端框架    | Hono                                                           | ^4.x     |
| 测试框架      | Vitest                                                         | ^3.x     |
| 类型系统      | TypeScript                                                     | ^5.x     |
| 模块格式      | ESM Only                                                       | -        |
| 包管理器      | pnpm                                                           | ^9.x     |
| Monorepo 工具 | Nx                                                             | ^22.x    |
| 库打包        | Rollup                                                         | ^4.x     |
| Schema 验证   | Zod                                                            | ^3.x     |

## Development Workflow

### 新功能开发流程

1. **规划阶段**: 创建 spec.md 定义用户场景和需求
2. **设计阶段**: 创建 plan.md 确定技术方案和架构
3. **任务拆解**: 创建 tasks.md 分解为可执行任务
4. **实现阶段**: 按任务顺序实现，每个模块完成后运行测试
5. **验证阶段**: 全量测试通过后提交 PR

### 代码提交规范

- 提交信息 MUST 遵循 Conventional Commits 格式
- 格式: `<type>(<scope>): <description>`
- 类型: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 质量门禁

- [ ] TypeScript 编译无错误 (`pnpm exec tsc --noEmit`)
- [ ] 单元测试通过 (`pnpm test`)
- [ ] ESLint 检查通过 (`pnpm lint`)
- [ ] 无 `any` 类型使用

## Governance

### 修订流程

1. 提出修订建议并说明理由
2. 在团队内部讨论并达成共识
3. 更新本文档并递增版本号
4. 更新相关模板和指导文件

### 版本策略

- **MAJOR**: 原则删除、重大重新定义、向后不兼容变更
- **MINOR**: 新增原则、显著扩展现有指导
- **PATCH**: 措辞澄清、拼写修正、非语义性调整

### 合规审查

- 所有 PR MUST 验证是否符合本宪法原则
- 复杂性偏离 MUST 记录理由并获得批准
- 定期（每季度）审查原则的适用性

**Version**: 1.0.0 | **Ratified**: 2025-12-25 | **Last Amended**: 2025-12-25

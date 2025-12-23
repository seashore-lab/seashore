# Seashore Agent Framework Constitution

## Core Principles

### I. TanStack AI 优先 (TanStack AI First)

所有 LLM 调用、工具定义、流式传输必须通过 @tanstack/ai 及其 adapter 实现。

**具体要求**:
- LLM 调用使用 `@tanstack/ai-openai`, `@tanstack/ai-anthropic`, `@tanstack/ai-gemini` adapter
- 工具定义使用 `toolDefinition()` 和 `.server()` / `.client()` 模式
- React 前端使用 `@tanstack/ai-react` 的 `useChat` hook
- 不得直接调用 LLM 原始 API（OpenAI SDK, Anthropic SDK 等），必须通过 adapter 封装
- 类型定义复用 @tanstack/ai 的类型系统，泛型参数透传

**理由**: 确保类型安全、统一接口、tree-shakeable、符合现代 AI 应用最佳实践。

### II. 测试先行 (Test-First, NON-NEGOTIABLE)

每个模块、每个功能必须编写测试。核心逻辑测试覆盖率必须 >80%。

**具体要求**:
- 使用 vitest 作为测试框架（ESM 原生支持）
- 测试文件放在 `packages/*/tests/` 目录下
- 单元测试必须独立可运行，不依赖外部服务
- 集成测试使用 Docker Compose 提供的测试环境（PostgreSQL, pgvector）
- 测试命名约定: `*.test.ts` (单元测试), `*.integration.test.ts` (集成测试)
- 每个 PR 必须包含相应的测试代码
- CI/CD 管道必须运行全量测试

**理由**: 防止回归错误、提高代码质量、支持重构、确保长期可维护性。

### III. 文档驱动验证 (Documentation-Driven Validation)

所有技术决策必须基于官方文档验证可行性，不得依赖猜测或过时资料。

**具体要求**:
- 研究阶段（Phase 0）必须产出 `research.md`，包含代码示例和文档引用
- API 契约定义（Phase 1）必须基于实际 API 和类型定义
- 遇到技术问题时优先查阅官方文档和 TypeScript 类型定义
- 关键技术决策必须在 `plan.md` 中记录理由和文档链接
- 使用 JSDoc 注释为公开 API 提供文档

**理由**: 减少技术债务、避免错误假设、提高团队知识共享效率。

### IV. Monorepo 模块化架构 (Monorepo Modular Architecture)

14 个功能模块作为独立的 npm 包发布，支持按需引入和 tree-shaking。

**具体要求**:
- 使用 pnpm workspaces 管理 Monorepo
- 使用 nx 进行任务编排和缓存优化
- 每个包遵循统一目录结构: `src/`, `tests/`, `package.json`, `README.md`
- 包命名规范: `@seashore/[module-name]` (例如: `@seashore/llm`, `@seashore/agent`)
- 每个包必须声明其依赖关系（内部包和外部包）
- 核心包（llm, tool）应保持最小依赖，可独立使用
- 所有包必须设置 `"type": "module"` (ESM Only)
- 使用 TypeScript project references 实现类型检查优化

**理由**: 支持渐进式采用、减少包体积、提高构建速度、便于维护。

### V. ESM Only (ES Modules Only)

所有代码必须使用 ES Modules，不支持 CommonJS。

**具体要求**:
- 所有 `package.json` 设置 `"type": "module"`
- 使用 `import/export` 语法，禁止 `require()`
- 构建产物输出 ESM 格式（`.js` + `.d.ts`）
- 使用 `.js` 扩展名导入本地模块（TypeScript 要求）
- vitest 配置为 ESM 模式

**理由**: 现代 JavaScript 标准、tree-shaking 支持、与 Cloudflare Workers 兼容。

### VI. 最小化 any (Minimize any Usage)

严格类型检查，禁止使用 `any`（除非有充分理由）。

**具体要求**:
- `tsconfig.json` 启用 `"strict": true`, `"noImplicitAny": true`
- 使用泛型参数传递类型信息
- 继承 @tanstack/ai 的类型系统，不重新发明类型
- 对于动态数据使用 `unknown` + 类型守卫，而不是 `any`
- 使用 Zod schema 定义运行时验证和类型推断

**理由**: 编译时错误检测、IDE 智能提示、减少运行时错误。

### VII. 渐进式复杂度 (Progressive Complexity)

优先实现核心功能（P1-P2），再添加增强功能（P3-P4），最后优化和集成（P5-P6）。

**具体要求**:
- Phase 1 (Critical): llm, tool, storage - 基础能力
- Phase 2 (High): agent, workflow - 核心业务逻辑
- Phase 3 (High): vectordb, rag, memory - 增强能力
- Phase 4 (Medium): mcp, observability, security, evaluation - 高级功能
- Phase 5 (High): genui, deploy - 用户界面和部署
- Phase 6 (High/Medium): 文档和示例
- 每个 Phase 完成后进行集成测试
- 不得跳跃式开发，必须按依赖关系顺序实施

**理由**: 降低项目风险、快速交付可用版本、便于迭代和调整。

### VIII. 服务端技术栈统一 (Unified Server Stack)

所有服务端功能基于 Hono 框架，优先支持 Cloudflare Workers，兼容 Node.js。

**具体要求**:
- 使用 Hono 作为 HTTP 框架（轻量、edge-first）
- API 路由: `/api/chat` (SSE), `/api/tools` (工具发现), `/health` (健康检查)
- 使用 Server-Sent Events (SSE) 实现流式响应
- 支持 CORS 配置（`cors` 中间件）
- Cloudflare Workers adapter 和 Node.js adapter 共享核心逻辑
- 环境变量通过 `.env` 文件管理（开发）和 Cloudflare Workers 环境变量（生产）

**理由**: Edge 性能、部署灵活性、开发体验一致性。

### IX. 前端技术栈统一 (Unified Frontend Stack)

所有前端组件基于 React 18，使用 @tanstack/ai-react。

**具体要求**:
- 使用 React 18 (支持 Concurrent Features)
- 使用 `@tanstack/ai-react` 的 `useChat` hook 管理聊天状态
- 生成式 UI 通过 Tool Call 驱动（GenUIRenderer 组件）
- 组件库使用 TypeScript + JSX
- 样式方案待定（Tailwind CSS 或 CSS-in-JS）
- 支持 Server-Sent Events (SSE) 流式响应
- 提供默认 ChatUI 组件和自定义 hooks

**理由**: 统一技术栈、复用 @tanstack/ai 生态、现代化用户体验。

### X. 数据库统一 (Unified Database)

所有数据存储使用 PostgreSQL（关系型 + pgvector 向量扩展 + tsvector 全文搜索）。

**具体要求**:
- 使用 PostgreSQL 15+ 版本
- 安装 pgvector 扩展支持向量存储
- 使用 Drizzle ORM 进行数据访问（类型安全、schema-first）
- 关系型数据: Thread, Message, Memory, Document, Chunk, WorkflowDefinition
- 向量数据: Chunk embeddings (使用 pgvector)
- 全文搜索: Document content (使用 tsvector)
- 混合检索: 向量相似度 + 关键词匹配
- 使用 Drizzle Kit 管理数据库迁移

**理由**: 简化架构、减少依赖、一致性保证、成本效益。

## Technical Constraints

### Performance Requirements
- Agent 端到端延迟 <100ms (不含 LLM 调用时间)
- 核心包 bundle 大小 <100KB gzipped
- 数据库查询响应时间 <50ms (P95)
- 向量检索响应时间 <100ms (P95, 1M vectors)

### Security Requirements
- 输入验证: 所有用户输入必须通过 Zod schema 验证
- 输出过滤: 使用 security module 过滤敏感信息（PII, credentials）
- Prompt Injection 防护: 检测和拒绝恶意 prompt
- Rate Limiting: API 端点限流（Cloudflare Workers 自带）
- 环境变量: API keys 不得硬编码，必须通过环境变量传递

### Deployment Requirements
- Cloudflare Workers: 主要部署目标，bundle 大小限制 1MB
- Node.js: 备选部署方式，支持 Node.js 20+
- Docker: 提供 Docker Compose 配置用于开发和测试
- CI/CD: GitHub Actions 自动化测试和部署

### Compatibility Requirements
- TypeScript: 5.x (strict mode)
- Node.js: 20+ (ESM 支持)
- PostgreSQL: 15+ (pgvector 0.5+)
- Browsers: 支持现代浏览器（Chrome/Firefox/Safari 最新版）

## Development Workflow

### Code Review Requirements
- 所有代码必须通过 Pull Request 提交
- 至少一名 reviewer 批准后方可合并
- PR 必须通过 CI/CD 测试（测试、lint、type-check）
- PR 描述必须包含: 变更内容、测试覆盖、breaking changes (如有)

### Testing Gates
- 单元测试覆盖率 >80% (核心模块)
- 集成测试必须通过（数据库、LLM mock）
- 端到端测试（至少一个完整流程）
- 性能测试（关键路径）

### Documentation Requirements
- 每个公开 API 必须有 JSDoc 注释
- 每个模块必须有 README.md（安装、使用、API）
- 复杂功能必须有示例代码
- 架构决策记录在 specs/ 目录

### Commit Message Convention
- 使用 Conventional Commits 格式
- 类型: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- 示例: `feat(llm): add Gemini adapter`, `fix(agent): handle tool timeout`

## Governance

### Constitution Authority
- 本宪法是 Seashore Agent Framework 项目的最高开发准则
- 所有技术决策必须符合本宪法原则
- 违反宪法的 PR 不得合并

### Amendment Process
- 宪法修订需要团队讨论和多数同意
- 修订必须记录理由和影响范围
- 重大修订需要更新版本号

### Complexity Justification
- 任何增加复杂度的设计必须在 `plan.md` 中说明理由
- 优先选择简单方案，除非有明确性能或功能需求
- 定期 review 架构，移除不必要的抽象

### Reference Materials
- 技术研究文档: `specs/001-agent-framework/research.md`
- 数据模型设计: `specs/001-agent-framework/data-model.md`
- 快速入门指南: `specs/001-agent-framework/quickstart.md`
- API 契约定义: `specs/001-agent-framework/contracts/`
- 任务分解: `specs/001-agent-framework/tasks.md`

**Version**: 1.0.0 | **Ratified**: 2025-12-24 | **Last Amended**: 2025-12-24

# Feature Specification: Examples 可运行示例集

**Feature Branch**: `master`  
**Created**: 2025-12-29  
**Status**: Draft  
**Input**: User description: "创建 examples 目录，为该库适用的场景/用例/用户故事，提供一系列具体的可运行的案例。优先基于 OpenAI 模型。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 快速上手基础 Agent (Priority: P1)

开发者想要快速了解如何创建最简单的 AI Agent。通过运行一个基础示例，开发者能够看到 Agent 的创建、配置和对话流程。

**Why this priority**: 这是框架最核心的入门用例，没有基础 Agent 示例，用户无法理解框架的基本用法。

**Independent Test**: 运行 `pnpm --filter examples run 01-basic-agent`，能够与 Agent 进行对话并获得响应。

**Acceptance Scenarios**:

1. **Given** 开发者已配置 OPENAI_API_KEY, **When** 运行基础 Agent 示例, **Then** 控制台输出 Agent 的回复
2. **Given** 示例代码, **When** 阅读代码, **Then** 代码简洁易懂，展示 createAgent 和 openaiText 的用法

---

### User Story 2 - 带工具的 Agent (Priority: P1)

开发者想要了解如何为 Agent 添加工具能力。通过运行带工具的示例，开发者能够看到工具定义、Agent 自动选择工具、执行工具并获取结果的完整流程。

**Why this priority**: 工具是 Agent 的核心能力扩展点，这是理解框架价值的关键示例。

**Independent Test**: 运行工具示例，输入需要工具协助的问题（如 "北京天气"），观察 Agent 调用工具并返回结果。

**Acceptance Scenarios**:

1. **Given** 定义了天气和计算器工具, **When** 用户询问天气, **Then** Agent 调用 weather 工具并返回格式化结果
2. **Given** 定义了计算器工具, **When** 用户询问数学计算, **Then** Agent 调用 calculator 工具并返回结果

---

### User Story 3 - 流式响应输出 (Priority: P1)

开发者想要实现打字机效果的流式输出。通过运行流式示例，开发者能够看到逐字输出的效果。

**Why this priority**: 流式输出是现代 AI 应用的标配体验，是生产应用必须掌握的技能。

**Independent Test**: 运行流式示例，观察文字逐字输出的打字机效果。

**Acceptance Scenarios**:

1. **Given** Agent 配置了流式模式, **When** 发送消息, **Then** 控制台逐字输出响应内容
2. **Given** 流式输出中, **When** Agent 调用工具, **Then** 能够看到工具调用事件

---

### User Story 4 - 多工具协作 Agent (Priority: P2)

开发者想要构建能够使用多个工具协作完成复杂任务的 Agent。示例展示 Serper 搜索和 Firecrawl 抓取工具的组合使用。

**Why this priority**: 多工具协作是构建强大 Agent 的关键能力。

**Independent Test**: 运行示例，让 Agent 搜索某个话题并抓取详细内容。

**Acceptance Scenarios**:

1. **Given** Agent 配置了搜索和抓取工具, **When** 用户请求研究某话题, **Then** Agent 先搜索再抓取详情

---

### User Story 5 - 简单工作流 (Priority: P2)

开发者想要构建多步骤工作流。示例展示两步工作流：第一步生成大纲，第二步根据大纲生成正文。

**Why this priority**: 工作流是处理复杂多步骤任务的核心能力。

**Independent Test**: 运行工作流示例，输入主题，获得先大纲后正文的输出。

**Acceptance Scenarios**:

1. **Given** 定义了两节点工作流, **When** 提供主题输入, **Then** 按顺序执行大纲和正文生成

---

### User Story 6 - RAG 知识库问答 (Priority: P2)

开发者想要实现基于知识库的问答。示例展示如何将文档导入内存向量存储，并基于相似度检索回答问题。

**Why this priority**: RAG 是企业知识问答的核心技术。

**Independent Test**: 运行 RAG 示例，导入示例文档，询问文档相关问题，获得准确回答。

**Acceptance Scenarios**:

1. **Given** 导入了示例文档, **When** 询问文档内容相关问题, **Then** Agent 检索相关片段并准确回答

---

### User Story 7 - 带记忆的对话 (Priority: P2)

开发者想要 Agent 能够记住对话历史。示例展示短期记忆的使用。

**Why this priority**: 记忆是实现连贯对话体验的关键。

**Independent Test**: 运行记忆示例，告诉 Agent 某信息，后续询问时 Agent 能正确回忆。

**Acceptance Scenarios**:

1. **Given** Agent 配置了记忆模块, **When** 进行多轮对话, **Then** Agent 能引用之前的对话内容

---

### User Story 8 - MCP 协议集成 (Priority: P3)

开发者想要通过 MCP 协议连接外部工具服务器。示例展示连接 MCP 文件系统服务器。

**Why this priority**: MCP 是 Agent 互操作的新兴标准。

**Independent Test**: 运行 MCP 示例，通过 Agent 列出指定目录的文件。

**Acceptance Scenarios**:

1. **Given** MCP 服务器运行中, **When** Agent 需要文件操作, **Then** 透明调用 MCP 工具

---

### User Story 9 - 安全护栏 (Priority: P3)

开发者想要对 Agent 输入输出进行安全检查。示例展示敏感词过滤和 PII 检测。

**Why this priority**: 安全是生产部署的必要条件。

**Independent Test**: 运行安全示例，输入敏感内容，观察被拦截。

**Acceptance Scenarios**:

1. **Given** 配置了安全护栏, **When** 用户输入敏感内容, **Then** 请求被拦截并提示

---

### User Story 10 - Agent 评测 (Priority: P3)

开发者想要评估 Agent 的回答质量。示例展示如何运行评测并生成报告。

**Why this priority**: 评测是优化 Agent 的基础。

**Independent Test**: 运行评测示例，获得评测报告。

**Acceptance Scenarios**:

1. **Given** 准备了测试数据集, **When** 运行评测, **Then** 输出评估指标报告

---

### User Story 11 - 可观测性追踪 (Priority: P3)

开发者想要监控 Agent 的运行状态。示例展示调用追踪和 Token 统计。

**Why this priority**: 可观测性是生产运维的关键。

**Independent Test**: 运行追踪示例，在控制台看到调用链和 Token 统计。

**Acceptance Scenarios**:

1. **Given** 启用了 observability, **When** Agent 执行任务, **Then** 输出 trace 和 token 统计

---

### User Story 12 - API 服务部署 (Priority: P3)

开发者想要将 Agent 部署为 HTTP API 服务。示例展示使用 Hono 创建服务。

**Why this priority**: API 部署是 Agent 落地的常见形式。

**Independent Test**: 运行部署示例，通过 curl 调用 API 获得响应。

**Acceptance Scenarios**:

1. **Given** 服务启动, **When** 发送 HTTP 请求, **Then** 返回 Agent 响应

---

### Edge Cases

- 未配置 API Key 时显示友好错误提示
- 网络超时时有重试机制或错误处理
- 工具执行失败时 Agent 能优雅处理

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: examples 目录 MUST 是独立的 npm 项目，使用 pnpm 管理
- **FR-002**: examples MUST 能够链接到外层 packages/ 的库实现，无需发包
- **FR-003**: 每个示例 MUST 有独立的运行脚本
- **FR-004**: 示例代码 MUST 简洁易懂，包含必要注释
- **FR-005**: 优先使用 OpenAI 模型作为默认 LLM

### Key Entities

- **Example**: 一个可运行的示例，包含源代码和运行脚本
- **ExamplesProject**: examples 目录下的 npm 项目

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 所有 12 个示例都能通过 `pnpm --filter examples run <example-name>` 成功运行
- **SC-002**: 新用户阅读示例代码 < 5 分钟能理解其功能
- **SC-003**: 示例覆盖框架 80% 以上的核心模块

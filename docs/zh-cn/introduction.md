# 简介

欢迎使用 **Seashore**，这是一个现代化的 TypeScript 智能体框架，用于构建 AI 驱动的应用程序。Seashore 提供了一套全面的工具和抽象，帮助开发者创建复杂的自主智能体、工作流和 AI 驱动的系统。

## 什么是 Seashore？

Seashore 是一个生产就绪的框架，它汇集了 AI 智能体开发的核心构建模块：

- **🤖 自主智能体**：创建能够推理、行动并使用工具来完成复杂任务的 ReAct 风格智能体
- **🔧 类型安全工具**：使用 Zod 模式定义工具，从定义到执行完全类型安全
- **🧠 多 LLM 支持**：通过统一的适配器无缝使用 OpenAI、Anthropic Claude 和 Google Gemini
- **🔄 可视化工作流**：使用基于节点的编排构建复杂的多步骤工作流
- **📚 RAG 管道**：通过文档加载器、分割器和向量搜索实现检索增强生成
- **💾 内存系统**：为您的智能体提供短期、中期和长期内存能力
- **🚀 生产就绪**：内置可观测性、评估、安全和部署工具

## 核心特性

### ReAct 智能体

Seashore 实现了 ReAct（推理 + 行动）模式，允许智能体：
- 逐步思考问题
- 选择并执行适当的工具
- 观察结果并调整方法
- 提供清晰的推理解释

### 类型安全工具系统

使用完整的 TypeScript 类型推断定义工具：

```typescript
const weatherTool = defineTool({
  name: 'get_weather',
  description: '获取当前天气',
  inputSchema: z.object({
    location: z.string()
  }),
  execute: async ({ location }) => ({
    temperature: 72,
    condition: '晴朗'
  }),
})
```

### 工作流编排

构建复杂的多步骤工作流，包括：
- 用于 AI 处理的 LLM 节点
- 用于外部操作的工具节点
- 用于分支逻辑的条件节点
- 用于并发执行的并行节点
- 用于任何逻辑的自定义节点

### 模块化架构

Seashore 采用模块化设计，您只需安装所需的内容：

- `@seashore/agent` - 核心智能体功能
- `@seashore/tool` - 工具定义和执行
- `@seashore/llm` - LLM 适配器（OpenAI、Anthropic、Gemini）
- `@seashore/workflow` - 工作流编排
- `@seashore/rag` - 检索增强生成
- `@seashore/memory` - 内存系统
- `@seashore/storage` - 持久化层
- `@seashore/vectordb` - 向量数据库操作
- `@seashore/mcp` - 模型上下文协议支持
- `@seashore/observability` - 日志记录、追踪、指标
- `@seashore/evaluation` - 智能体评估工具
- `@seashore/security` - 防护和内容审核
- `@seashore/deploy` - 部署实用工具
- `@seashore/genui` - React UI 组件
- `@seashore/contextengineering` - 上下文优化

## 设计理念

Seashore 基于几个核心原则构建：

1. **类型安全优先**：利用 TypeScript 的类型系统在编译时捕获错误
2. **模块化设计**：仅使用您需要的包，避免不必要的膨胀
3. **开发者体验**：清晰的 API、全面的文档和有用的示例
4. **生产就绪**：内置可观测性、错误处理和安全功能
5. **框架无关**：可与任何 TypeScript/JavaScript 项目一起使用

## 谁应该使用 Seashore？

Seashore 非常适合：

- **应用程序开发者**在现有应用中构建 AI 驱动的功能
- **AI 工程师**创建自主智能体和复杂工作流
- **产品团队**原型设计 AI 助手和聊天机器人
- **研究人员**实验智能体架构和 RAG 系统
- **初创公司**构建 AI 优先的产品

## 与其他框架的比较

Seashore 与 LangChain、Mastra、Agno 和 Google ADK 等框架类似，但有关键区别：

- **TypeScript 优先**：原生 TypeScript 支持，具有完整的类型推断（不是 Python 移植）
- **模块化包**：仅安装您需要的内容，而不是单一的整体框架
- **现代技术栈**：基于 TanStack AI 构建 LLM 适配器
- **生产专注**：开箱即用可观测性、评估和安全功能
- **工作流优先**：可视化工作流编排作为一等公民

## 下一步？

准备好开始了吗？前往[快速开始](./quick-start.md)指南，在几分钟内创建您的第一个智能体。

或者探索特定功能：

- [智能体](./core/agents.md) - 了解 ReAct 智能体和配置
- [工具](./core/tools.md) - 为您的智能体定义自定义工具
- [工作流](./core/workflows.md) - 构建多步骤 AI 工作流
- [RAG](./advanced/rag.md) - 实现检索增强生成
- [示例](./examples/overview.md) - 浏览 15+ 个完整示例

## 社区与支持

- **GitHub**：[z0gSh1u/seashore](https://github.com/z0gSh1u/seashore)
- **问题**：在 GitHub 上报告错误和请求功能
- **示例**：查看[示例目录](https://github.com/z0gSh1u/seashore/tree/master/examples)获取工作代码

## 许可证

Seashore 是在 MIT 许可证下发布的开源软件。

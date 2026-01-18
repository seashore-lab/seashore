# 快速开始

本指南将帮助您在几分钟内使用 Seashore 创建您的第一个 AI 智能体。

## 前置要求

在开始之前，请确保您具备：

- **Node.js** 20.0.0 或更高版本
- **pnpm**（推荐）或 npm/yarn
- 来自 OpenAI、Anthropic 或 Google 的 **API 密钥**

## 安装

Seashore 被组织成模块化包。对于基本智能体，您需要：

```bash
pnpm add @seashore/agent @seashore/llm @seashore/tool zod
```

或使用 npm：

```bash
npm install @seashore/agent @seashore/llm @seashore/tool zod
```

## 您的第一个智能体

让我们创建一个可以回答问题的简单智能体：

### 1. 设置环境

在项目根目录创建一个 `.env` 文件：

```env
OPENAI_API_KEY=your_api_key_here
```

### 2. 创建基本智能体

创建一个名为 `basic-agent.ts` 的文件：

```typescript
import 'dotenv/config'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

// 创建一个简单的智能体
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: '你是一个有用的助手。',
})

// 使用单个问题运行智能体
const result = await agent.run('什么是 TypeScript？')
console.log(result.content)
```

### 3. 运行您的智能体

```bash
npx tsx basic-agent.ts
```

恭喜！您已经创建了第一个 Seashore 智能体！🎉

## 添加工具

当智能体可以使用工具时，它们会变得强大。让我们创建一个带有天气工具的智能体：

```typescript
import 'dotenv/config'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'
import { defineTool } from '@seashorelab/tool'
import { z } from 'zod'

// 定义一个天气工具
const weatherTool = defineTool({
  name: 'get_weather',
  description: '获取城市的当前天气',
  inputSchema: z.object({
    city: z.string().describe('城市名称'),
  }),
  execute: async ({ city }) => {
    // 在生产环境中，调用真实的天气 API
    const mockData: Record<string, any> = {
      '东京': { temperature: 22, condition: '晴朗' },
      '伦敦': { temperature: 15, condition: '多云' },
      '纽约': { temperature: 18, condition: '晴朗' },
    }

    return mockData[city] || {
      temperature: 20,
      condition: '未知'
    }
  },
})

// 创建带有工具的智能体
const agent = createAgent({
  name: 'weather-assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: '你是一个天气助手。',
  tools: [weatherTool],
})

// 询问天气
const result = await agent.run('东京的天气怎么样？')
console.log(result.content)
// 智能体将自动调用天气工具并包含结果
```

## 流式响应

为了获得更好的用户体验，流式传输智能体的响应：

```typescript
import 'dotenv/config'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
})

// 流式传输响应
for await (const chunk of agent.stream('给我讲一个短故事')) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## 多轮对话

通过传递消息历史构建对话式智能体：

```typescript
import 'dotenv/config'
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
})

// 多轮对话
const messages = [
  { role: 'user', content: '我的名字是爱丽丝。' },
  { role: 'assistant', content: '你好爱丽丝！我能为你做什么？' },
  { role: 'user', content: '我的名字是什么？' },
] as const

for await (const chunk of agent.chat(messages)) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

## 使用不同的 LLM 提供商

Seashore 支持多个 LLM 提供商。只需交换适配器：

### Anthropic Claude

```typescript
import { anthropicText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  model: anthropicText('claude-3-5-sonnet-20241022', {
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
})
```

### Google Gemini

```typescript
import { geminiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  model: geminiText('gemini-2.0-flash-exp', {
    apiKey: process.env.GEMINI_API_KEY,
  }),
})
```

## 下一步

现在您已经创建了第一个智能体，探索更多功能：

### 核心概念
- [**智能体**](./core/agents.md) - 深入了解智能体配置和能力
- [**工具**](./core/tools.md) - 了解工具验证、客户端工具和审批流程
- [**工作流**](./core/workflows.md) - 构建多步骤 AI 工作流

### 高级功能
- [**RAG**](./advanced/rag.md) - 为您的智能体添加知识检索
- [**内存**](./advanced/memory.md) - 为您的智能体提供跨对话的内存
- [**存储**](./advanced/storage.md) - 将对话持久化到数据库
- [**MCP**](./advanced/mcp.md) - 连接到模型上下文协议服务器

### 生产功能
- [**可观测性**](./production/observability.md) - 监控和追踪您的智能体
- [**安全**](./production/security.md) - 添加防护和内容审核
- [**部署**](./production/deployment.md) - 将智能体部署为 API 服务器

### 通过示例学习

查看[示例](./examples/overview.md)部分，获取 15+ 个涵盖框架各个方面的完整工作示例。

## 常见模式

### 错误处理

```typescript
import { AgentError } from '@seashorelab/agent'

try {
  const result = await agent.run('您的问题')
  console.log(result.content)
} catch (error) {
  if (error instanceof AgentError) {
    console.error('智能体错误:', error.code, error.message)
  } else {
    console.error('意外错误:', error)
  }
}
```

### 带退避的重试

```typescript
import { withRetry } from '@seashorelab/agent'

const result = await withRetry(
  () => agent.run('您的问题'),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
)
```

### 自定义工具上下文

将上下文传递给工具执行：

```typescript
const tool = defineTool({
  name: 'get_user_data',
  description: '获取用户数据',
  inputSchema: z.object({
    userId: z.string(),
  }),
  execute: async ({ userId }, context) => {
    // 访问自定义上下文
    const database = context.database
    return await database.getUser(userId)
  },
})

// 运行时传递上下文
const result = await agent.run('获取用户 123', {
  toolContext: { database: myDatabase },
})
```

## 故障排除

### API 密钥问题

确保您的环境变量已加载：

```typescript
import 'dotenv/config' // 必须在文件顶部
```

### 类型错误

确保您有最新版本：

```bash
pnpm update @seashore/agent @seashore/llm @seashore/tool
```

### 流式传输不工作

某些模型需要特定设置。查看 [LLM 文档](./core/llm.md)了解详细信息。

## 获取帮助

- 浏览[示例](./examples/overview.md)
- 查看 [API 参考](./api/agent.md)
- 在 [GitHub](https://github.com/z0gSh1u/seashore/issues)上提交问题

准备好构建令人惊叹的东西了吗？让我们开始吧！🚀

# Quickstart: Seashore Agent 框架

**Feature**: 001-agent-framework  
**Date**: 2025-12-25

## 安装

```bash
# 安装核心包
pnpm add @seashorelab/agent @seashorelab/llm @seashorelab/tool

# 安装 LLM Provider 适配器（选择需要的）
pnpm add @tanstack/ai-openai @tanstack/ai-anthropic @tanstack/ai-gemini
```

## 创建你的第一个 Agent

### 1. 定义工具

```typescript
// tools/weather.ts
import { defineTool } from '@seashorelab/tool'
import { z } from 'zod'

export const weatherTool = defineTool({
  name: 'get_weather',
  description: '获取指定城市的当前天气',
  inputSchema: z.object({
    city: z.string().describe('城市名称'),
  }),
  execute: async ({ city }) => {
    // 实际实现中调用天气 API
    return {
      city,
      temperature: 25,
      conditions: '晴朗',
      humidity: 60,
    }
  },
})
```

### 2. 创建 Agent

```typescript
// agent.ts
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@tanstack/ai-openai'
import { weatherTool } from './tools/weather'

export const weatherAgent = createAgent({
  name: 'WeatherAgent',
  systemPrompt: '你是一个天气助手，可以帮助用户查询天气信息。',
  model: openaiText('gpt-4o'),
  tools: [weatherTool],
})
```

### 3. 运行 Agent

```typescript
// main.ts
import { weatherAgent } from './agent'

async function main() {
  // 同步模式
  const result = await weatherAgent.run('北京今天天气怎么样？')
  console.log(result.content)

  // 流式模式
  for await (const chunk of weatherAgent.stream('上海明天会下雨吗？')) {
    if (chunk.type === 'content') {
      process.stdout.write(chunk.delta)
    } else if (chunk.type === 'tool_call') {
      console.log(`\n[调用工具: ${chunk.toolCall.name}]`)
    }
  }
}

main()
```

## 使用预置工具

```typescript
import { createAgent } from '@seashorelab/agent'
import { serperTool, firecrawlTool } from '@seashorelab/tool/presets'
import { openaiText } from '@tanstack/ai-openai'

const researchAgent = createAgent({
  name: 'ResearchAgent',
  systemPrompt: '你是一个研究助手，可以搜索网络并抓取网页内容。',
  model: openaiText('gpt-4o'),
  tools: [
    serperTool({ apiKey: process.env.SERPER_API_KEY }),
    firecrawlTool({ apiKey: process.env.FIRECRAWL_API_KEY }),
  ],
})
```

## 部署为 API 服务

```typescript
// server.ts
import { createServer } from '@seashorelab/deploy'
import { weatherAgent } from './agent'

const app = createServer({
  agents: {
    weather: weatherAgent,
  },
})

// 本地开发
app.listen(3000)

// Cloudflare Workers
export default app
```

客户端调用：

```typescript
// 使用 SSE 流式响应
const response = await fetch('http://localhost:3000/api/agents/weather/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: '北京天气如何？' }],
  }),
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(decoder.decode(value))
}
```

## 添加 RAG 能力

```typescript
import { createAgent } from '@seashorelab/agent'
import { createVectorStore } from '@seashorelab/vectordb'
import { createRAG } from '@seashorelab/rag'
import { openaiText } from '@tanstack/ai-openai'

// 创建向量存储
const vectorStore = createVectorStore({
  connectionString: process.env.DATABASE_URL,
  collection: 'knowledge-base',
})

// 添加文档
await vectorStore.addDocuments([
  { content: '公司成立于 2020 年...' },
  { content: '产品包括 A、B、C...' },
])

// 创建带 RAG 的 Agent
const ragAgent = createAgent({
  name: 'KnowledgeAgent',
  systemPrompt: '你是一个知识库助手。',
  model: openaiText('gpt-4o'),
  rag: createRAG({
    vectorStore,
    topK: 5,
    hybridSearch: true, // 启用混合检索
  }),
})
```

## 使用生成式 UI

```tsx
// ChatApp.tsx
import { Chat, useChat } from '@seashorelab/genui'
import { WeatherCard, StockChart } from './components'

// 注册自定义 UI 组件
const genUIComponents = {
  'weather-card': WeatherCard,
  'stock-chart': StockChart,
}

function ChatApp() {
  return (
    <Chat
      endpoint="/api/agents/assistant/chat"
      genUIComponents={genUIComponents}
      placeholder="输入消息..."
    />
  )
}
```

## 环境变量

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/seashore

# LLM API Keys (选择需要的)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# 预置工具 API Keys (可选)
SERPER_API_KEY=...
FIRECRAWL_API_KEY=...
```

## 下一步

- 📖 [API 文档](./contracts/) - 详细的 API 参考
- 🔧 [工具开发指南](./contracts/tool.api.md) - 创建自定义工具
- 🔄 [工作流指南](./contracts/workflow.api.md) - 编排多步骤任务
- 📊 [可观测性指南](./contracts/observability.api.md) - 监控和调试

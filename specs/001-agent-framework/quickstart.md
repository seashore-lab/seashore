# Seashore Agent Framework - 快速开始

本指南帮助你快速上手 Seashore Agent Framework。

## 前置要求

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (需要 pgvector 扩展)

## 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/seashore.git
cd seashore

# 安装依赖
pnpm install

# 构建所有包
pnpm build
```

## 环境配置

创建 `.env` 文件：

```env
# LLM API Keys
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_API_KEY=xxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/seashore

# Tool API Keys
SERPER_API_KEY=xxx
FIRECRAWL_API_KEY=xxx
```

## 基础用法

### 1. 创建 LLM 客户端

```typescript
import { createLLMClient } from '@seashore/llm'

// OpenAI
const openai = createLLMClient({
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
})

// Anthropic
const anthropic = createLLMClient({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Gemini
const gemini = createLLMClient({
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKey: process.env.GOOGLE_AI_API_KEY,
})

// 发送消息
const response = await openai.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
})
console.log(response.content)
```

### 2. 定义工具

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const calculator = defineTool({
  name: 'calculator',
  description: '执行数学计算',
  parameters: z.object({
    expression: z.string().describe('数学表达式'),
  }),
  execute: async ({ expression }) => {
    const result = eval(expression) // 仅演示，生产环境请使用安全的计算库
    return { result }
  },
})

// 使用预置工具
import { createSerperTool, createFirecrawlTool } from '@seashore/tool'

const search = createSerperTool({
  apiKey: process.env.SERPER_API_KEY,
})

const scraper = createFirecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY,
})
```

### 3. 创建 Agent

```typescript
import { createReActAgent } from '@seashore/agent'

const agent = createReActAgent({
  llm: openai,
  tools: [calculator, search, scraper],
  systemPrompt: `你是一个有用的助手，可以使用工具来回答问题。`,
  maxIterations: 10,
})

// 执行 Agent
const result = await agent.run('今天北京的天气怎么样？')
console.log(result.finalResponse)
```

### 4. 设置存储

```typescript
import { createStorage } from '@seashore/storage'

const storage = await createStorage({
  connectionString: process.env.DATABASE_URL,
})

// 创建线程
const thread = await storage.threads.create({
  metadata: { userId: 'user-123' },
})

// 保存消息
await storage.messages.create({
  threadId: thread.id,
  role: 'user',
  content: 'Hello!',
})

// 获取线程历史
const messages = await storage.messages.findByThread(thread.id)
```

### 5. 实现 RAG

```typescript
import { createVectorStore } from '@seashore/vectordb'
import { createRAG } from '@seashore/rag'

// 向量存储
const vectorStore = await createVectorStore({
  connectionString: process.env.DATABASE_URL,
  dimensions: 1536,
  hnswConfig: { m: 16, efConstruction: 64 },
})

// RAG 管道
const rag = await createRAG({
  vectorStore,
  embeddingClient: openai, // 复用 LLM 客户端的嵌入功能
  chunkingStrategy: {
    type: 'sentence',
    options: { maxChunkSize: 512, overlap: 50 },
  },
})

// 导入文档
await rag.ingest([
  { id: 'doc1', content: '文档内容...', metadata: { source: 'file.pdf' } },
])

// 检索
const chunks = await rag.retrieve('相关查询', {
  method: 'hybrid',
  topK: 5,
  alpha: 0.5, // 50% 向量 + 50% 关键词
})

// 增强提示
const augmentedPrompt = await rag.augmentPrompt('用户问题', chunks)
```

### 6. 部署服务

```typescript
import { createSeashoreApp } from '@seashore/deploy'

const app = createSeashoreApp({
  port: 3000,
  cors: { origin: '*' },
  healthCheck: '/health',

  llm: { provider: 'openai', model: 'gpt-4o' },
  tools: [search, calculator],

  chat: {
    path: '/api/chat',
    streaming: true,
  },

  observability: {
    serviceName: 'my-agent',
    logging: { level: 'info' },
  },
})

// Node.js 部署
await app.startNodeServer(3000)

// 或 Cloudflare Workers
export default app.toCloudflareWorker()
```

## 前端集成

```tsx
import { ChatUI, createComponentRegistry, useSeashoreChat } from '@seashore/genui'

// 使用完整 ChatUI 组件
function App() {
  return <ChatUI endpoint="/api/chat" theme={{ primaryColor: '#0066cc' }} />
}

// 或使用 Hook 自定义
function CustomChat() {
  const { messages, sendMessage, isLoading } = useSeashoreChat({
    endpoint: '/api/chat',
  })

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value)
            e.currentTarget.value = ''
          }
        }}
        disabled={isLoading}
      />
    </div>
  )
}
```

## 工作流示例

```typescript
import { createWorkflowEngine, defineWorkflow } from '@seashore/workflow'

// 定义工作流
const workflow = defineWorkflow('research', 'Research Workflow')
  .addNode({ id: 'input', type: 'input' })
  .addNode({
    id: 'search',
    type: 'tool',
    toolId: 'search',
    input: '{{input.query}}',
  })
  .addNode({
    id: 'analyze',
    type: 'agent',
    agentId: 'researcher',
    prompt: '分析搜索结果: {{search.results}}',
  })
  .addNode({
    id: 'output',
    type: 'output',
    value: '{{analyze.response}}',
  })
  .addEdge('input', 'search')
  .addEdge('search', 'analyze')
  .addEdge('analyze', 'output')
  .build()

// 创建引擎
const engine = createWorkflowEngine({
  storage,
  agents: { researcher: researcherAgent },
  tools: { search },
})

await engine.register(workflow)

// 执行
const execution = await engine.execute('research', {
  query: 'What is RAG?',
})
```

## MCP 集成

```typescript
import { createMCPClient, createMCPToolsBridge } from '@seashore/mcp'

const mcpClient = await createMCPClient({
  servers: [
    {
      id: 'filesystem',
      name: 'Filesystem',
      transport: {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', './docs'],
      },
    },
  ],
})

await mcpClient.connectAll()

// 将 MCP 工具转换为 Seashore 工具
const bridge = createMCPToolsBridge(mcpClient)
const mcpTools = await bridge.getTools()

// 用于 Agent
const agent = createReActAgent({
  llm: openai,
  tools: [...localTools, ...mcpTools],
})
```

## 下一步

- 查看 [API 文档](./contracts/) 了解完整接口
- 查看 [示例项目](../examples/) 获取更多用例
- 阅读 [架构指南](./architecture.md) 了解设计决策

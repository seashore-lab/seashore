# Research: Seashore Agent Framework

**Date**: 2025-12-24  
**Feature**: 001-agent-framework  
**Purpose**: 解决 Technical Context 中的技术决策问题

## 1. @tanstack/ai 核心能力调研

### 1.1 Provider Adapter 架构

**决策**: 使用 @tanstack/ai 的 tree-shakeable adapter 模式

**调研结果**:

- @tanstack/ai 提供独立的 provider adapter 包：`@tanstack/ai-openai`, `@tanstack/ai-anthropic`, `@tanstack/ai-gemini`
- 每个 adapter 导出 `xxxText()` 函数用于文本生成
- 支持统一的 `chat()` 函数配合不同 adapter

**代码示例**:

```typescript
import { chat, toStreamResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { geminiText } from '@tanstack/ai-gemini'

// 统一接口，动态切换 Provider
const adapters = {
  openai: () => openaiText('gpt-4o'),
  anthropic: () => anthropicText('claude-sonnet-4-5'),
  gemini: () => geminiText('gemini-2.5-pro'),
}

const stream = chat({
  adapter: adapters[provider](),
  messages,
})
```

**理由**:

- Tree-shakeable，按需引入
- 类型安全，统一接口
- 符合宪法原则 I（TanStack AI 优先）

### 1.2 Tool Definition 架构

**决策**: 使用 @tanstack/ai 的 `toolDefinition()` isomorphic 架构

**调研结果**:

- `toolDefinition()` 支持 Zod Schema 定义输入输出
- 支持 `.server()` 和 `.client()` 分别定义服务端和客户端实现
- 类型自动推断，无需手动定义

**代码示例**:

```typescript
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

const searchToolDef = toolDefinition({
  name: 'search',
  description: 'Search the web',
  inputSchema: z.object({
    query: z.string(),
  }),
})

// 服务端实现
const searchTool = searchToolDef.server(async ({ query }) => {
  return { results: await search(query) }
})
```

**理由**:

- 类型安全
- 前后端统一定义
- 符合宪法原则 I

### 1.3 React Hooks

**决策**: 使用 @tanstack/ai-react 的 `useChat` hook

**调研结果**:

- `useChat` 提供完整的聊天状态管理
- 支持流式响应、工具调用状态、错误处理
- 与 `fetchServerSentEvents` 配合实现 SSE 流式

**代码示例**:

```typescript
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'

function Chat() {
  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })
  // ...
}
```

### 1.4 多模态支持

**决策**: 图片生成使用 `createOpenaiImage` / `createGeminiImage`

**调研结果**:

- @tanstack/ai 支持图片生成 adapter
- 视频生成、Transcription、TTS 需要检查是否已支持

**待验证**: 运行时验证 @tanstack/ai 实际导出的多模态能力

## 2. Drizzle ORM + PostgreSQL 调研

### 2.1 pgvector 集成

**决策**: 使用 pgvector 扩展 + HNSW 索引

**调研结果**:

- Drizzle 支持 PostgreSQL 自定义类型
- pgvector 可通过 `customType` 定义
- HNSW 索引可在 migration 中配置

**代码示例**:

```typescript
import { customType, index, pgTable } from 'drizzle-orm/pg-core'

const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)' // OpenAI embedding dimension
  },
})

export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    embedding: vector('embedding'),
  },
  (t) => [
    index('idx_embedding').using('hnsw', t.embedding, {
      opclass: 'vector_cosine_ops',
    }),
  ]
)
```

### 2.2 tsvector 全文搜索

**决策**: 使用 PostgreSQL 原生 tsvector + 生成列

**调研结果**:

- Drizzle 支持 `generatedAlwaysAs()` 创建生成列
- tsvector 可通过 `customType` 定义
- GIN 索引加速全文搜索

**代码示例**:

```typescript
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    contentSearch: tsvector('content_search').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${documents.content})`
    ),
  },
  (t) => [index('idx_content_search').using('gin', t.contentSearch)]
)
```

### 2.3 混合检索

**决策**: 结合 pgvector 语义搜索 + tsvector 关键词搜索

**实现方案**:

1. 向量搜索：`embedding <=> query_embedding` (cosine distance)
2. 关键词搜索：`content_search @@ to_tsquery(query)`
3. 融合：RRF (Reciprocal Rank Fusion) 算法合并结果

## 3. Hono + Cloudflare Workers 调研

### 3.1 SSE 流式响应

**决策**: 使用 Hono 的 `streamSSE` helper

**调研结果**:

- Hono 提供 `streamSSE` 处理 SSE
- Cloudflare Workers 需设置 `Content-Encoding: Identity`

**代码示例**:

```typescript
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

app.get('/chat', (c) => {
  c.header('Content-Encoding', 'Identity') // Cloudflare Workers 兼容
  return streamSSE(c, async (stream) => {
    // 流式输出
    await stream.writeSSE({ data: 'Hello', event: 'message' })
  })
})
```

### 3.2 环境兼容

**决策**: 抽象适配层，同时支持 Cloudflare Workers 和 Node.js

**实现方案**:

- `@seashore/deploy` 提供 `createCloudflareHandler()` 和 `createNodeHandler()`
- 核心逻辑与运行时解耦
- 数据库连接通过环境变量配置

## 4. 生成式 UI 调研

### 4.1 Tool Call 驱动

**决策**: 使用 Tool Call 返回 UI 组件定义，前端渲染

**实现方案**:

- 定义 `renderUI` 工具，输入为组件类型和 props
- 前端根据 tool-result 动态渲染组件
- 支持自定义组件注册

**代码示例**:

```typescript
// 工具定义
const renderUIDef = toolDefinition({
  name: 'renderUI',
  description: 'Render a UI component',
  inputSchema: z.object({
    component: z.enum(['chart', 'table', 'card']),
    props: z.record(z.unknown()),
  }),
})

// 前端渲染
function GenUIRenderer({ part }) {
  if (part.type === 'tool-result' && part.name === 'renderUI') {
    const { component, props } = part.output
    const Component = componentRegistry[component]
    return <Component {...props} />
  }
}
```

## 5. 预置工具调研

### 5.1 Serper API

**决策**: 封装 Serper API 作为 Web 搜索工具

**API 文档**:

- Endpoint: `https://google.serper.dev/search`
- 需要 API Key
- 返回结构化搜索结果

### 5.2 Firecrawl API

**决策**: 封装 Firecrawl API 作为网页抓取工具

**API 文档**:

- 支持 URL 抓取和内容提取
- 返回 Markdown 格式内容

## 6. 依赖版本确认

| 依赖                   | 版本要求 | 说明              |
| ---------------------- | -------- | ----------------- |
| @tanstack/ai           | latest   | 核心 AI 能力      |
| @tanstack/ai-react     | latest   | React hooks       |
| @tanstack/ai-openai    | latest   | OpenAI adapter    |
| @tanstack/ai-anthropic | latest   | Anthropic adapter |
| @tanstack/ai-gemini    | latest   | Gemini adapter    |
| drizzle-orm            | latest   | ORM               |
| drizzle-kit            | latest   | Migration 工具    |
| hono                   | latest   | Web 框架          |
| zod                    | latest   | Schema 验证       |
| vitest                 | latest   | 测试框架          |
| @opentelemetry/api     | latest   | 可观测性          |

## 7. 未解决问题

| 问题                            | 状态   | 备注               |
| ------------------------------- | ------ | ------------------ |
| @tanstack/ai TTS 支持           | 待验证 | 运行时检查实际导出 |
| @tanstack/ai Transcription 支持 | 待验证 | 运行时检查实际导出 |
| @tanstack/ai 视频生成支持       | 待验证 | 运行时检查实际导出 |

**处理策略**: 如果 @tanstack/ai 尚未支持，按宪法要求暂不实现，等待上游支持后再添加。

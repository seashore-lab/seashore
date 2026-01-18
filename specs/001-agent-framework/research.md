# Research: Agent 研发框架

**Feature**: 001-agent-framework  
**Date**: 2025-12-25

## 研究任务清单

| 任务                      | 状态    | 结论                               |
| ------------------------- | ------- | ---------------------------------- |
| @tanstack/ai 核心 API     | ✅ 完成 | chat/generate/toolDefinition 可用  |
| @tanstack/ai 多模态支持   | ✅ 完成 | 图片/视频/TTS/Transcription 全支持 |
| Drizzle + pgvector        | ✅ 完成 | 原生支持 vector 类型和 HNSW 索引   |
| Drizzle + tsvector        | ✅ 完成 | 支持 generated column + GIN 索引   |
| Hono + Cloudflare Workers | ✅ 完成 | 原生支持，需注意 Content-Encoding  |
| Hono SSE Streaming        | ✅ 完成 | streamSSE() 函数开箱即用           |

---

## 1. @tanstack/ai 核心 API

### 研究问题

`@tanstack/ai` 提供哪些核心函数？如何与 LLM Provider 交互？

### 研究结果

**核心函数**:

- `chat()` - 流式对话，支持工具调用和 Agent 循环
- `generate()` 或 `ai()` - 统一的文本生成接口
- `embedding()` - 文本嵌入向量生成
- `summarize()` - 文本摘要

**适配器架构**:

- Tree-shakeable 设计，按需导入
- 细粒度适配器：`openaiText`, `anthropicText`, `geminiText`
- 废弃单体适配器：`openai()`, `anthropic()`

**工具定义**:

```typescript
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

const weatherToolDef = toolDefinition({
  name: 'get_weather',
  description: 'Get current weather',
  inputSchema: z.object({
    location: z.string(),
  }),
})

// 服务端实现
const weatherTool = weatherToolDef.server(async ({ location }) => {
  return { temperature: 72, conditions: 'sunny' }
})
```

**流式响应**:

```typescript
for await (const chunk of chat({
  adapter: openaiText('gpt-4o'),
  messages,
  tools: [weatherTool],
})) {
  if (chunk.type === 'content') {
    console.log(chunk.delta)
  }
}
```

### 决策

- **采纳**: 使用 `chat()` 作为 Agent 核心循环
- **采纳**: 使用 `toolDefinition()` 定义工具
- **采纳**: 使用细粒度适配器导入

---

## 2. @tanstack/ai 多模态支持

### 研究问题

@tanstack/ai 是否支持图片生成、视频生成、TTS、Transcription？

### 研究结果

| 能力       | 函数                      | 支持的 Provider                                     |
| ---------- | ------------------------- | --------------------------------------------------- |
| 图片生成   | `generateImage()`         | OpenAI (DALL-E 3, gpt-image-1), Gemini (Imagen 3/4) |
| 视频生成   | `generateVideo()`         | OpenAI (Sora-2)                                     |
| 语音转文字 | `generateTranscription()` | OpenAI (Whisper-1, GPT-4o-transcribe)               |
| 文字转语音 | `generateSpeech()`        | OpenAI (TTS-1, TTS-1-HD), Gemini (experimental)     |

**图片生成示例**:

```typescript
import { generateImage } from '@tanstack/ai'
import { openaiImage } from '@tanstack/ai-openai'

const result = await generateImage({
  adapter: openaiImage('dall-e-3'),
  prompt: 'A sunset over mountains',
  size: '1024x1024',
})
console.log(result.images[0].url)
```

**语音转文字示例**:

```typescript
import { generateTranscription } from '@tanstack/ai'
import { openaiTranscription } from '@tanstack/ai-openai'

const result = await generateTranscription({
  adapter: openaiTranscription('whisper-1'),
  audio: audioFile,
  language: 'en',
})
console.log(result.text)
```

**文字转语音示例**:

```typescript
import { generateSpeech } from '@tanstack/ai'
import { openaiTTS } from '@tanstack/ai-openai'

const result = await generateSpeech({
  adapter: openaiTTS('tts-1'),
  text: 'Hello world',
  voice: 'alloy',
})
// result.audio 为 base64 编码音频
```

### 决策

- **采纳**: 在 `@seashorelab/llm` 中导出所有多模态函数
- **延迟**: 视频生成（Sora 仍在受限访问）

---

## 3. Drizzle + pgvector

### 研究问题

如何在 Drizzle ORM 中使用 pgvector 实现向量存储和 HNSW 索引？

### 研究结果

**Schema 定义**:

```typescript
import { index, pgTable, serial, text, vector } from 'drizzle-orm/pg-core'

export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
  },
  (table) => [
    index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ]
)
```

**相似度搜索**:

```typescript
import { cosineDistance, desc, gt, sql } from 'drizzle-orm'

const findSimilar = async (queryEmbedding: number[]) => {
  const similarity = sql`1 - (${cosineDistance(documents.embedding, queryEmbedding)})`

  return db
    .select({
      id: documents.id,
      content: documents.content,
      similarity,
    })
    .from(documents)
    .where(gt(similarity, 0.5))
    .orderBy(desc(similarity))
    .limit(10)
}
```

**前置条件**:

- PostgreSQL 需安装 pgvector 扩展：`CREATE EXTENSION vector;`

### 决策

- **采纳**: 使用 Drizzle 原生 vector 类型
- **采纳**: 使用 HNSW 索引 + vector_cosine_ops
- **采纳**: 使用 `cosineDistance` 函数计算相似度

---

## 4. Drizzle + tsvector (全文搜索)

### 研究问题

如何在 Drizzle 中实现基于 PostgreSQL tsvector 的全文搜索？

### 研究结果

**自定义 tsvector 类型**:

```typescript
import { customType } from 'drizzle-orm/pg-core'

export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})
```

**Schema 定义 (Generated Column)**:

```typescript
export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    search: tsvector('search')
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', ${documents.title}), 'A') || 
            setweight(to_tsvector('english', ${documents.content}), 'B')`
      ),
  },
  (t) => [index('idx_search').using('gin', t.search)]
)
```

**全文搜索查询**:

```typescript
const search = async (query: string) => {
  return db.execute(
    sql`SELECT * FROM documents 
        WHERE search @@ to_tsquery('english', ${query})
        ORDER BY ts_rank(search, to_tsquery('english', ${query})) DESC`
  )
}
```

### 决策

- **采纳**: 使用 generated column 自动维护 tsvector
- **采纳**: 使用 setweight 实现标题/内容权重区分
- **采纳**: 使用 GIN 索引加速全文搜索

---

## 5. Hono + Cloudflare Workers

### 研究问题

如何在 Hono 中支持 Cloudflare Workers 部署和流式响应？

### 研究结果

**基本配置**:

```typescript
import { Hono } from 'hono'

type Bindings = {
  DATABASE_URL: string
  OPENAI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.text('Hello Hono!'))

export default app
```

**Cloudflare Workers 流式响应注意事项**:

```typescript
app.get('/stream', (c) => {
  // 必须设置此 header 以确保流式传输正常
  c.header('Content-Encoding', 'Identity')

  return streamText(c, async (stream) => {
    await stream.write('Hello')
    await stream.write(' World')
  })
})
```

**环境变量类型生成**:

```bash
pnpm exec wrangler types --env-interface CloudflareBindings
```

### 决策

- **采纳**: 使用 Hono 泛型注入 Bindings 类型
- **采纳**: 流式响应时设置 `Content-Encoding: Identity`
- **采纳**: 使用 wrangler types 生成类型定义

---

## 6. Hono SSE Streaming

### 研究问题

如何使用 Hono 实现 Server-Sent Events (SSE)？

### 研究结果

**streamSSE() 函数**:

```typescript
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

const app = new Hono()

app.get('/chat', async (c) => {
  return streamSSE(c, async (stream) => {
    // 发送 SSE 事件
    await stream.writeSSE({
      data: JSON.stringify({ content: 'Hello' }),
      event: 'message',
      id: '1',
    })

    // 可以循环发送
    for await (const chunk of chatStream) {
      await stream.writeSSE({
        data: JSON.stringify(chunk),
        event: 'chunk',
      })
    }
  })
})
```

**与 @tanstack/ai 集成**:

```typescript
import { chat, toServerSentEventsStream } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'

app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const stream = chat({
    adapter: openaiText('gpt-4o'),
    messages,
    tools: [...],
  })

  return toServerSentEventsStream(stream)
})
```

### 决策

- **采纳**: 使用 `streamSSE()` 实现 SSE
- **采纳**: 使用 `toServerSentEventsStream()` 转换 @tanstack/ai 流

---

## 7. 生成式 UI (Tool Call 方式)

### 研究问题

如何使用 Tool Call 方式实现生成式 UI？

### 研究结果

**原理**: 将 UI 组件渲染作为工具调用的结果处理，而非解析 LLM 输出中的 XML 标签。

**工具定义示例**:

```typescript
const showWeatherCardDef = toolDefinition({
  name: 'show_weather_card',
  description: 'Display a weather card UI component',
  inputSchema: z.object({
    location: z.string(),
    temperature: z.number(),
    conditions: z.string(),
    icon: z.string(),
  }),
})
```

**客户端实现**:

```typescript
const showWeatherCard = showWeatherCardDef.client((input) => {
  // 触发 React 状态更新，渲染 WeatherCard 组件
  setUIComponents((prev) => [
    ...prev,
    {
      type: 'weather-card',
      props: input,
    },
  ])
  return { rendered: true }
})
```

**组件注册表**:

```typescript
const GenUIRegistry = {
  'weather-card': WeatherCard,
  'stock-chart': StockChart,
  'product-card': ProductCard,
}

function GenUIRenderer({ components }) {
  return components.map((comp, i) => {
    const Component = GenUIRegistry[comp.type]
    return <Component key={i} {...comp.props} />
  })
}
```

### 决策

- **采纳**: 使用 clientTools 定义 UI 渲染工具
- **采纳**: 创建 GenUIRegistry 管理组件映射
- **采纳**: 提供 GenUIRenderer 统一渲染入口

---

## 总结

所有研究任务已完成，无待澄清事项。技术栈选型可行，可进入 Phase 1 设计阶段。

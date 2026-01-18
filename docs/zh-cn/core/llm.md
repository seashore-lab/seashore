# 大语言模型适配器

`@seashorelab/llm` 提供具有统一接口的特定于提供商的适配器。智能体和工作流通过共享的 `chat()` API 使用这些适配器。

## 文本适配器

- OpenAI: `openaiText(modelName, options)`
- Anthropic: `anthropicText(modelName, options)`
- Gemini: `geminiText(modelName, options)`

示例：

```ts
import { openaiText } from '@seashorelab/llm'

const model = openaiText('gpt-5.1', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
})
```

## 嵌入和多模态

Seashore 还为以下功能提供适配器：

- 嵌入（由 RAG / 向量数据库使用）
- 图像生成
- 视频生成
- 语音转文本和文本转语音

请参阅：

- [嵌入](./llm/embeddings.md)
- [多模态支持](./llm/multimodal.md)

# 大语言模型适配器

Seashore 为多个大语言模型提供商提供统一的适配器。所有适配器都实现相同的接口，使得在提供商之间切换变得容易，而无需更改代码。

## 支持的提供商

- **OpenAI** - GPT-4o、GPT-4、GPT-3.5 等
- **Anthropic** - Claude 3.5 Sonnet、Claude 3 Opus/Sonnet/Haiku
- **Google** - Gemini 2.0 Flash、Gemini 1.5 Pro/Flash

## 文本适配器

### OpenAI

```typescript
import { openaiText } from '@seashorelab/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // 可选
  organization: 'org-xxx', // 可选
})
```

**可用模型：**
- `gpt-4o` - 最有能力，多模态
- `gpt-4o-mini` - 快速且经济实惠
- `gpt-4-turbo` - 上一代旗舰
- `gpt-4` - 原始 GPT-4
- `gpt-3.5-turbo` - 快速且经济

### Anthropic Claude

```typescript
import { anthropicText } from '@seashorelab/llm'

const model = anthropicText('claude-3-5-sonnet-20241022', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com', // 可选
})
```

**可用模型：**
- `claude-3-5-sonnet-20241022` - 最有能力的 Claude
- `claude-3-opus-20240229` - 最高智能
- `claude-3-sonnet-20240229` - 平衡性能
- `claude-3-haiku-20240307` - 最快且最紧凑

### Google Gemini

```typescript
import { geminiText } from '@seashorelab/llm'

const model = geminiText('gemini-2.0-flash-exp', {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com', // 可选
})
```

**可用模型：**
- `gemini-2.0-flash-exp` - 最新实验模型
- `gemini-1.5-pro` - 最有能力的 Gemini
- `gemini-1.5-flash` - 快速且高效

## 使用适配器

### 直接聊天

您可以直接使用适配器而不需要智能体：

```typescript
import { openaiText, chat } from '@seashorelab/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
})

// 单条消息
const response = await chat(model, [
  { role: 'user', content: 'Hello!' }
])

console.log(response.content) // "Hello! How can I help you today?"
```

### 流式传输

```typescript
import { openaiText } from '@seashorelab/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
})

for await (const chunk of model.chat([
  { role: 'user', content: 'Tell me a story' }
])) {
  if (chunk.type === 'content' && chunk.delta) {
    process.stdout.write(chunk.delta)
  }
}
```

### 与智能体一起使用

适配器主要用于智能体：

```typescript
import { createAgent } from '@seashorelab/agent'
import { openaiText } from '@seashorelab/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are helpful.',
})
```

## 配置选项

### 温度

控制随机性（0.0 到 2.0）：

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7, // 默认因提供商而异
})
```

### 最大 Token 数

限制响应长度：

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 1000,
})
```

### Top P

核采样（温度的替代方案）：

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  topP: 0.9,
})
```

### 停止序列

定义停止条件：

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  stop: ['END', '\n\n'],
})
```

## 消息格式

所有适配器都使用一致的消息格式：

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string // 用于工具消息
  tool_call_id?: string // 用于工具响应
  tool_calls?: ToolCall[] // 用于助手工具调用
}
```

示例：

```typescript
const messages = [
  {
    role: 'system',
    content: 'You are a helpful assistant.'
  },
  {
    role: 'user',
    content: 'What is TypeScript?'
  },
  {
    role: 'assistant',
    content: 'TypeScript is a superset of JavaScript...'
  },
] as const
```

## Token 使用跟踪

所有响应都包括 Token 使用信息：

```typescript
const response = await chat(model, messages)

console.log(response.usage)
// {
//   promptTokens: 15,
//   completionTokens: 87,
//   totalTokens: 102
// }
```

## 嵌入

生成用于语义搜索的文本嵌入：

```typescript
import { openaiEmbed, generateEmbedding, generateBatchEmbeddings } from '@seashorelab/llm'

const embedder = openaiEmbed('text-embedding-3-small', 1536, {
  apiKey: process.env.OPENAI_API_KEY,
})

// 单个嵌入
const result = await generateEmbedding({
  adapter: embedder,
  input: 'Hello world',
})
console.log(result.embedding) // 长度为 1536 的 number[]

// 批量嵌入
const batchResult = await generateBatchEmbeddings({
  adapter: embedder,
  input: ['Hello', 'World', 'TypeScript'],
})
console.log(batchResult.embeddings) // number[][] 数组
```

**OpenAI 嵌入模型：**
- `text-embedding-3-small` - 1536 维，高效
- `text-embedding-3-large` - 3072 维，最有能力
- `text-embedding-ada-002` - 1536 维，旧版

## 多模态支持

### 图像生成

```typescript
import { openaiImage, generateImage } from '@seashorelab/llm'

const generator = openaiImage('dall-e-3', {
  apiKey: process.env.OPENAI_API_KEY,
})

const result = await generateImage({
  adapter: generator,
  prompt: 'A serene Japanese garden with cherry blossoms',
  size: '1024x1024',
  quality: 'hd',
})

console.log(result.images[0].url) // 图像 URL
```

### 视觉（图像理解）

```typescript
import { openaiText, chat } from '@seashorelab/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
})

const response = await chat(model, [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this image?' },
      {
        type: 'image_url',
        image_url: { url: 'https://example.com/image.jpg' }
      },
    ],
  },
])
```

### 文本转语音

```typescript
import { openaiTTS, generateSpeech } from '@seashorelab/llm'

const tts = openaiTTS('tts-1', {
  apiKey: process.env.OPENAI_API_KEY,
})

const result = await generateSpeech({
  adapter: tts,
  input: 'Hello, this is a test.',
  voice: 'alloy',
})

// result.audio 是一个 AudioBuffer
```

### 语音转文本

```typescript
import { openaiTranscription, transcribeAudio } from '@seashorelab/llm'

const transcriber = openaiTranscription('whisper-1', {
  apiKey: process.env.OPENAI_API_KEY,
})

const result = await transcribeAudio({
  adapter: transcriber,
  file: audioFile, // File 或 Blob
  language: 'en',
})

console.log(result.text) // 转录的文本
```

## 错误处理

所有适配器都抛出标准化错误：

```typescript
import { chat } from '@seashorelab/llm'

try {
  const response = await chat(model, messages)
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // 处理速率限制
    await delay(1000)
    retry()
  } else if (error.code === 'INVALID_API_KEY') {
    // 处理身份验证
  } else {
    // 处理其他错误
  }
}
```

## 自定义基础 URL

使用自定义 API 端点（例如，用于代理或兼容服务）：

```typescript
// Azure OpenAI
const model = openaiText('gpt-4o', {
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
})

// OpenRouter
const model = openaiText('meta-llama/llama-2-70b-chat', {
  apiKey: process.env.OPENROUTER_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

// 本地大语言模型
const model = openaiText('local-model', {
  apiKey: 'not-needed',
  baseURL: 'http://localhost:1234/v1',
})
```

## 最佳实践

1. **环境变量**：在环境变量中存储 API 密钥
2. **错误处理**：始终处理 API 错误并实现重试
3. **Token 限制**：注意模型上下文限制
4. **成本监控**：在生产环境中跟踪 Token 使用
5. **速率限制**：为速率限制错误实现退避
6. **提供商选择**：基于能力和成本选择模型
7. **流式传输**：使用流式传输以获得更好的用户体验
8. **缓存**：适当时缓存响应

## 选择提供商

| 提供商 | 最适合 | 优势 |
|----------|----------|-----------|
| OpenAI | 通用 | 最有能力，最佳工具使用 |
| Anthropic | 长上下文、分析 | 最适合推理，200K 上下文 |
| Google | 多模态 | 快速，适合图像/视频 |

## 下一步

- [OpenAI](./llm/openai.md) - 详细的 OpenAI 配置
- [Anthropic](./llm/anthropic.md) - Claude 特定功能
- [Google Gemini](./llm/gemini.md) - Gemini 配置
- [嵌入](./llm/embeddings.md) - 向量嵌入指南
- [多模态](./llm/multimodal.md) - 图像、音频、视频

## 示例

- [01：基本智能体](../examples/01-basic-agent.md) - 使用大语言模型适配器
- [02：带有工具的智能体](../examples/02-agent-tools-stream.md) - 使用大语言模型流式传输
- [04：RAG](../examples/04-basic-rag.md) - 使用嵌入

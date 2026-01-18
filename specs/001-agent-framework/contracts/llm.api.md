# API Contract: @seashorelab/llm

**Package**: `@seashorelab/llm`  
**Version**: 0.1.0

## 概述

LLM 模块作为 `@tanstack/ai-*` 适配器的统一导出层，提供 OpenAI、Gemini、Anthropic 三家 Provider 的支持，以及多模态能力（图片生成、视频生成、TTS、Transcription）。

---

## 导出

```typescript
// 文本适配器 (re-export from @tanstack/ai-*)
export { openaiText, anthropicText, geminiText } from './adapters'

// 图片生成
export { openaiImage, geminiImage, generateImage } from './image'

// 视频生成
export { openaiVideo, generateVideo } from './video'

// 语音转文字
export { openaiTranscription, generateTranscription } from './transcription'

// 文字转语音
export { openaiTTS, geminiSpeech, generateSpeech } from './tts'

// 嵌入向量
export { openaiEmbed, geminiEmbed, generateEmbedding } from './embedding'

// 核心函数 (re-export from @tanstack/ai)
export {
  chat,
  generate,
  toStreamResponse,
  toServerSentEventsStream,
} from '@tanstack/ai'

// 类型
export type {
  TextAdapter,
  ImageAdapter,
  VideoAdapter,
  TranscriptionAdapter,
  TTSAdapter,
  EmbeddingAdapter,
  Message,
  StreamChunk,
  TokenUsage,
} from './types'
```

---

## 文本生成适配器

### 使用方式

```typescript
import { openaiText, anthropicText, geminiText } from '@seashorelab/llm'
import { chat } from '@seashorelab/llm'

// OpenAI
const openaiAdapter = openaiText('gpt-4o')

// Anthropic
const anthropicAdapter = anthropicText('claude-3-5-sonnet-20241022')

// Gemini
const geminiAdapter = geminiText('gemini-2.0-flash')

// 使用适配器进行对话
for await (const chunk of chat({
  adapter: openaiAdapter,
  messages: [{ role: 'user', content: 'Hello!' }],
})) {
  console.log(chunk)
}
```

### 配置 API Key

适配器默认从环境变量读取 API Key：

- `OPENAI_API_KEY` for OpenAI
- `ANTHROPIC_API_KEY` for Anthropic
- `GOOGLE_API_KEY` for Gemini

也可以显式传入：

```typescript
import { createOpenaiText } from '@tanstack/ai-openai'

const adapter = createOpenaiText({
  apiKey: 'sk-...',
  model: 'gpt-4o',
})
```

---

## 图片生成

### generateImage

```typescript
import { generateImage, openaiImage, geminiImage } from '@seashorelab/llm'

// OpenAI DALL-E
const result = await generateImage({
  adapter: openaiImage('dall-e-3'),
  prompt: 'A sunset over mountains',
  size: '1024x1024',
  modelOptions: {
    quality: 'hd',
    style: 'vivid',
  },
})

console.log(result.images[0].url)

// Gemini Imagen
const geminiResult = await generateImage({
  adapter: geminiImage('imagen-3.0-generate-002'),
  prompt: 'A futuristic cityscape',
  modelOptions: {
    aspectRatio: '16:9',
  },
})

console.log(geminiResult.images[0].b64Json)
```

### 返回类型

```typescript
interface ImageGenerationResult {
  id: string
  model: string
  images: Array<{
    url?: string // OpenAI
    b64Json?: string // Base64 编码图片
    revisedPrompt?: string
  }>
  usage?: TokenUsage
}
```

---

## 视频生成

### generateVideo

```typescript
import { generateVideo, openaiVideo } from '@seashorelab/llm'

// 创建视频生成任务
const job = await generateVideo({
  adapter: openaiVideo('sora-2'),
  prompt: 'A golden retriever puppy playing in a field',
  duration: 8,
  size: '1280x720',
})

console.log('Job ID:', job.jobId)

// 轮询检查状态
const status = await checkVideoStatus(job.jobId)
if (status.status === 'completed') {
  console.log('Video URL:', status.videoUrl)
}
```

---

## 语音转文字

### generateTranscription

```typescript
import { generateTranscription, openaiTranscription } from '@seashorelab/llm'
import { readFile } from 'fs/promises'

const audioBuffer = await readFile('./recording.mp3')
const audioFile = new File([audioBuffer], 'recording.mp3', { type: 'audio/mpeg' })

const result = await generateTranscription({
  adapter: openaiTranscription('whisper-1'),
  audio: audioFile,
  language: 'zh',
  modelOptions: {
    response_format: 'verbose_json',
  },
})

console.log('Transcription:', result.text)
console.log('Segments:', result.segments)
```

### 支持的音频输入

- `File` 对象
- `Blob` 对象
- `ArrayBuffer`
- Base64 编码字符串
- Data URL

---

## 文字转语音

### generateSpeech

```typescript
import { generateSpeech, openaiTTS, geminiSpeech } from '@seashorelab/llm'

// OpenAI TTS
const result = await generateSpeech({
  adapter: openaiTTS('tts-1-hd'),
  text: 'Hello, welcome to Seashore!',
  voice: 'nova',
  format: 'mp3',
})

console.log('Audio (base64):', result.audio)
console.log('Content-Type:', result.contentType)

// Gemini TTS (experimental)
const geminiResult = await generateSpeech({
  adapter: geminiSpeech('gemini-2.5-flash-preview-tts'),
  text: 'Hello from Gemini!',
})
```

### 返回类型

```typescript
interface SpeechResult {
  audio: string // Base64 编码音频
  format: string // 'mp3', 'wav', etc.
  contentType: string
}
```

---

## 嵌入向量

### generateEmbedding

```typescript
import { generateEmbedding, openaiEmbed } from '@seashorelab/llm'

const result = await generateEmbedding({
  adapter: openaiEmbed('text-embedding-3-small'),
  input: 'Hello world',
})

console.log('Embedding:', result.embedding) // number[]
console.log('Dimensions:', result.embedding.length) // 1536
```

### 批量嵌入

```typescript
const results = await generateEmbedding({
  adapter: openaiEmbed('text-embedding-3-small'),
  input: ['Text 1', 'Text 2', 'Text 3'],
})

console.log('Embeddings:', results.embeddings) // number[][]
```

---

## 流式响应处理

### toStreamResponse

将 @tanstack/ai 流转换为标准 Response 对象：

```typescript
import { chat, toStreamResponse } from '@seashorelab/llm'
import { openaiText } from '@seashorelab/llm'

// 在 Hono 路由中
app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const stream = chat({
    adapter: openaiText('gpt-4o'),
    messages,
  })

  return toStreamResponse(stream)
})
```

### toServerSentEventsStream

转换为 SSE 格式：

```typescript
import { chat, toServerSentEventsStream } from '@seashorelab/llm'

app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const stream = chat({
    adapter: openaiText('gpt-4o'),
    messages,
  })

  return toServerSentEventsStream(stream)
})
```

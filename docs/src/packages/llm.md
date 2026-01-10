# @seashore/llm

Unified LLM adapter interface supporting OpenAI, Anthropic, and Google Gemini.

## Installation

```bash
pnpm add @seashore/llm
```

Requires one or more provider packages:
```bash
pnpm add @tanstack/ai-openai @tanstack/ai-anthropic @tanstack/ai-gemini
```

## Overview

`@seashore/llm` provides:

- Unified adapters for OpenAI, Anthropic, and Gemini
- Text generation with streaming support
- Multimodal capabilities (images, video, audio)
- Embeddings and structured output
- Easy provider switching

## Quick Start

### Basic Usage

```typescript
import { openaiText, chat } from '@seashore/llm'

const model = openaiText('gpt-4o')

for await (const chunk of chat({
  adapter: model,
  messages: [{ role: 'user', content: 'Hello!' }],
})) {
  if (chunk.type === 'content-delta') {
    process.stdout.write(chunk.content)
  }
}
```

### With an Agent

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are helpful.',
})
```

## API Reference

### Text Adapters

#### openaiText

```typescript
import { openaiText } from '@seashore/llm'

const model = openaiText('gpt-4o', {
  apiKey?: string,           // Default: process.env.OPENAI_API_KEY
  baseURL?: string,          // Custom endpoint
  temperature?: number,      // 0-2, default: depends on model
  maxTokens?: number,        // Max tokens to generate
})
```

#### anthropicText

```typescript
import { anthropicText } from '@seashore/llm'

const model = anthropicText('claude-3-5-sonnet-20241022', {
  apiKey?: string,           // Default: process.env.ANTHROPIC_API_KEY
  baseURL?: string,
  temperature?: number,
  maxTokens?: number,
})
```

#### geminiText

```typescript
import { geminiText } from '@seashore/llm'

const model = geminiText('gemini-2.0-flash-exp', {
  apiKey?: string,           // Default: process.env.GOOGLE_API_KEY
  temperature?: number,
  maxTokens?: number,
})
```

## Core Functions

### chat

Chat with message history and optional tools.

```typescript
import { chat } from '@seashore/llm'

for await (const chunk of chat({
  adapter: model,
  messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hello!' },
  ],
  tools?: Tool[],
  temperature?: number,
  maxTokens?: number,
})) {
  // Handle chunks
}
```

### generate

Simple text generation.

```typescript
import { generate } from '@seashore/llm'

const result = await generate({
  adapter: model,
  prompt: 'Write a haiku about AI.',
})

console.log(result.text)
console.log(result.usage)
```

### Structured Output

Get JSON output matching a Zod schema:

```typescript
import { generate } from '@seashore/llm'
import { z } from 'zod'

const schema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
  score: z.number(),
})

const result = await generate({
  adapter: model,
  prompt: 'Analyze this text...',
  outputSchema: schema,
})

console.log(result.data) // Type-safe output
```

## Multimodal

### Image Generation

```typescript
import { generateImage, openaiImage } from '@seashore/llm'

const result = await generateImage({
  adapter: openaiImage('dall-e-3'),
  prompt: 'A serene mountain landscape',
  size: '1024x1024',
  modelOptions: {
    quality: 'hd',
    style: 'vivid',
  },
})

console.log(result.images[0].url)
```

### Speech to Text

```typescript
import { generateTranscription, openaiTranscription } from '@seashore/llm'

const result = await generateTranscription({
  adapter: openaiTranscription('whisper-1'),
  audio: audioFile, // File, Blob, ArrayBuffer, or base64
  language: 'en',
})

console.log(result.text)
```

### Text to Speech

```typescript
import { generateSpeech, openaiTTS } from '@seashore/llm'

const result = await generateSpeech({
  adapter: openaiTTS('tts-1'),
  text: 'Hello, world!',
  voice: 'nova',
})

console.log(result.audio) // Base64 encoded
```

### Embeddings

```typescript
import { generateEmbedding, openaiEmbed } from '@seashore/llm'

const result = await generateEmbedding({
  adapter: openaiEmbed('text-embedding-3-small'),
  input: 'Hello, world!',
})

console.log(result.embedding) // number[]
```

## Streaming

### Stream Response

For web responses:

```typescript
import { toStreamResponse, chat } from '@seashore/llm'

app.post('/api/chat', async (c) => {
  const stream = chat({
    adapter: model,
    messages: await c.req.json(),
  })

  return toStreamResponse(stream)
})
```

### Server-Sent Events

For SSE streaming:

```typescript
import { toServerSentEventsStream, chat } from '@seashore/llm'

app.post('/api/chat', async (c) => {
  const stream = chat({ adapter: model, messages: [...] })
  return toServerSentEventsStream(stream)
})
```

## Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=...
```

## Switching Providers

Easy provider switching:

```typescript
// Using OpenAI
const agent1 = createAgent({
  model: openaiText('gpt-4o'),
  // ... rest same
})

// Switch to Anthropic
const agent2 = createAgent({
  model: anthropicText('claude-3-5-sonnet-20241022'),
  // ... same config
})

// Switch to Gemini
const agent3 = createAgent({
  model: geminiText('gemini-2.0-flash-exp'),
  // ... same config
})
```

## Best Practices

1. **Set appropriate temperature**:
   - 0.0-0.3: Factual, deterministic
   - 0.4-0.7: Balanced
   - 0.8-1.0: Creative

2. **Monitor token usage** with `result.usage`

3. **Handle errors** for rate limits and API issues

4. **Use streaming** for better UX in chat applications

## See Also

- [LLM Adapters Core Concept](../core-concepts/llm-adapters.md)
- [Agent Package](agent.md)

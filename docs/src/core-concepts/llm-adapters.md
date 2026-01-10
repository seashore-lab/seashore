# LLM Adapters

Seashore provides a unified interface for working with multiple LLM providers through the `@seashore/llm` package. Built on top of `@tanstack/ai`, it supports OpenAI, Anthropic, and Google Gemini.

## Supported Providers

| Provider | Adapter | Models |
|----------|---------|--------|
| OpenAI | `openaiText()` | GPT-4o, GPT-4o-mini, GPT-3.5-turbo |
| Anthropic | `anthropicText()` | Claude 3.5 Sonnet, Claude 3 Haiku |
| Google | `geminiText()` | Gemini 2.0 Flash, Gemini 1.5 Pro |

## Basic Usage

### Creating an Adapter

```typescript
import { openaiText, anthropicText, geminiText } from '@seashore/llm'

// OpenAI
const openai = openaiText('gpt-4o')

// Anthropic
const anthropic = anthropicText('claude-3-5-sonnet-20241022')

// Gemini
const gemini = geminiText('gemini-2.0-flash-exp')
```

### Using with an Agent

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
})
```

### Using Directly

You can use adapters directly without an agent:

```typescript
import { openaiText, generate } from '@seashore/llm'

const model = openaiText('gpt-4o')
const result = await generate({
  adapter: model,
  prompt: 'Write a haiku about programming.',
})

console.log(result.text)
```

## Configuration

### API Key

Adapters automatically read API keys from environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=...
```

### Custom API Key

Provide an API key explicitly:

```typescript
const model = openaiText('gpt-4o', {
  apiKey: 'sk-custom-key',
})
```

### Custom Base URL

Use a custom endpoint (useful for proxies or compatible APIs):

```typescript
const model = openaiText('gpt-4o', {
  baseURL: 'https://custom-endpoint.com/v1',
})
```

## Text Generation

### Synchronous

```typescript
import { generate, openaiText } from '@seashore/llm'

const result = await generate({
  adapter: openaiText('gpt-4o'),
  prompt: 'What is TypeScript?',
})

console.log(result.text)
console.log(result.usage) // { promptTokens: 10, completionTokens: 50 }
```

### Streaming

```typescript
import { openaiText, chat } from '@seashore/llm'

const model = openaiText('gpt-4o')

for await (const chunk of chat({
  adapter: model,
  messages: [{ role: 'user', content: 'Tell me a story' }],
})) {
  if (chunk.type === 'content-delta') {
    process.stdout.write(chunk.content)
  }
}
```

### Chat Messages

```typescript
await chat({
  adapter: model,
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'How are you?' },
  ],
})
```

## Structured Output

Get JSON output from the LLM:

```typescript
import { generate, openaiText } from '@seashore/llm'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  age: z.number(),
  hobbies: z.array(z.string()),
})

const result = await generate({
  adapter: openaiText('gpt-4o'),
  prompt: 'Extract information about Alice, 25, who likes hiking and coding.',
  outputSchema: schema,
})

console.log(result.data)
// { name: 'Alice', age: 25, hobbies: ['hiking', 'coding'] }
```

## Multimodal Capabilities

### Image Generation

```typescript
import { generateImage, openaiImage } from '@seashore/llm'

const result = await generateImage({
  adapter: openaiImage('dall-e-3'),
  prompt: 'A serene mountain landscape at sunset',
  size: '1024x1024',
})

console.log(result.images[0].url)
```

### Speech to Text (Transcription)

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

console.log(result.audio) // Base64 encoded audio
```

### Embeddings

```typescript
import { generateEmbedding, openaiEmbed } from '@seashore/llm'

const result = await generateEmbedding({
  adapter: openaiEmbed('text-embedding-3-small'),
  input: 'Hello, world!',
})

console.log(result.embedding) // number[]
console.log(result.embedding.length) // 1536
```

## Streaming to Web

### Stream Response

```typescript
import { toStreamResponse, chat, openaiText } from '@seashore/llm'

// In a Hono route
app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const stream = chat({
    adapter: openaiText('gpt-4o'),
    messages,
  })

  return toStreamResponse(stream)
})
```

### Server-Sent Events

```typescript
import { toServerSentEventsStream, chat, openaiText } from '@seashore/llm'

app.post('/api/chat', async (c) => {
  const { messages } = await c.req.json()

  const stream = chat({
    adapter: openaiText('gpt-4o'),
    messages,
  })

  return toServerSentEventsStream(stream)
})
```

## Temperature and Sampling

Control the randomness of outputs:

```typescript
const model = openaiText('gpt-4o', {
  temperature: 0.1, // Lower = more focused, deterministic
  // or
  temperature: 0.9, // Higher = more creative, random
})

// Max tokens
const model = openaiText('gpt-4o', {
  maxTokens: 1000,
})
```

## Switching Providers

Seashore's unified interface makes it easy to switch between providers:

```typescript
// Using OpenAI
const agent1 = createAgent({
  model: openaiText('gpt-4o'),
  // ... rest of config
})

// Switch to Anthropic - just change the adapter!
const agent2 = createAgent({
  model: anthropicText('claude-3-5-sonnet-20241022'),
  // ... same config
})
```

## Best Practices

1. **Choose the Right Model**: Consider cost, speed, and capabilities

2. **Set Temperature Appropriately**:
   - 0.0-0.3 for factual, deterministic tasks
   - 0.4-0.7 for balanced responses
   - 0.8-1.0 for creative tasks

3. **Handle Errors Gracefully**:

```typescript
try {
  const result = await generate({ adapter: model, prompt: '...' })
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // Implement backoff
  }
}
```

4. **Monitor Token Usage**: Track costs by monitoring `result.usage`

## Next Steps

- [Agents](agents.md) - Use LLM adapters with agents
- [Tools](tools.md) - Give LLMs tools to use
- [Tutorials](../tutorials/) - Complete examples

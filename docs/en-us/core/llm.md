# LLM Adapters

`@seashore/llm` provides provider-specific adapters with a unified interface. Agents and workflows use these adapters through the shared `chat()` API.

## Text Adapters

- OpenAI: `openaiText(modelName, options)`
- Anthropic: `anthropicText(modelName, options)`
- Gemini: `geminiText(modelName, options)`

Example:

```ts
import { openaiText } from '@seashore/llm'

const model = openaiText('gpt-5.1', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
})
```

## Embeddings and Multimodal

Seashore also provides adapters for:

- embeddings (used by RAG / vector db)
- image generation
- video generation
- speech-to-text and text-to-speech

See:

- [Embeddings](./llm/embeddings.md)
- [Multimodal Support](./llm/multimodal.md)
# LLM Adapters

Seashore provides unified adapters for multiple LLM providers. All adapters implement the same interface, making it easy to switch between providers without changing your code.

## Supported Providers

- **OpenAI** - GPT-4o, GPT-4, GPT-3.5, and more
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku
- **Google** - Gemini 2.0 Flash, Gemini 1.5 Pro/Flash

## Text Adapters

### OpenAI

```typescript
import { openaiText } from '@seashore/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // Optional
  organization: 'org-xxx', // Optional
})
```

**Available Models:**
- `gpt-4o` - Most capable, multimodal
- `gpt-4o-mini` - Fast and affordable
- `gpt-4-turbo` - Previous generation flagship
- `gpt-4` - Original GPT-4
- `gpt-3.5-turbo` - Fast and economical

### Anthropic Claude

```typescript
import { anthropicText } from '@seashore/llm'

const model = anthropicText('claude-3-5-sonnet-20241022', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com', // Optional
})
```

**Available Models:**
- `claude-3-5-sonnet-20241022` - Most capable Claude
- `claude-3-opus-20240229` - Highest intelligence
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-haiku-20240307` - Fastest and most compact

### Google Gemini

```typescript
import { geminiText } from '@seashore/llm'

const model = geminiText('gemini-2.0-flash-exp', {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com', // Optional
})
```

**Available Models:**
- `gemini-2.0-flash-exp` - Latest experimental model
- `gemini-1.5-pro` - Most capable Gemini
- `gemini-1.5-flash` - Fast and efficient

## Using Adapters

### Direct Chat

You can use adapters directly without agents:

```typescript
import { openaiText, chat } from '@seashore/llm'

const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
})

// Single message
const response = await chat(model, [
  { role: 'user', content: 'Hello!' }
])

console.log(response.content) // "Hello! How can I help you today?"
```

### Streaming

```typescript
import { openaiText } from '@seashore/llm'

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

### With Agents

Adapters are primarily used with agents:

```typescript
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  systemPrompt: 'You are helpful.',
})
```

## Configuration Options

### Temperature

Controls randomness (0.0 to 2.0):

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7, // Default varies by provider
})
```

### Max Tokens

Limit response length:

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  maxTokens: 1000,
})
```

### Top P

Nucleus sampling (alternative to temperature):

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  topP: 0.9,
})
```

### Stop Sequences

Define stop conditions:

```typescript
const model = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  stop: ['END', '\n\n'],
})
```

## Message Format

All adapters use a consistent message format:

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string // For tool messages
  tool_call_id?: string // For tool responses
  tool_calls?: ToolCall[] // For assistant tool calls
}
```

Example:

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

## Token Usage Tracking

All responses include token usage information:

```typescript
const response = await chat(model, messages)

console.log(response.usage)
// {
//   promptTokens: 15,
//   completionTokens: 87,
//   totalTokens: 102
// }
```

## Embeddings

Generate text embeddings for semantic search:

```typescript
import { openaiEmbed, generateEmbedding, generateBatchEmbeddings } from '@seashore/llm'

const embedder = openaiEmbed('text-embedding-3-small', 1536, {
  apiKey: process.env.OPENAI_API_KEY,
})

// Single embedding
const result = await generateEmbedding({
  adapter: embedder,
  input: 'Hello world',
})
console.log(result.embedding) // number[] of length 1536

// Batch embeddings
const batchResult = await generateBatchEmbeddings({
  adapter: embedder,
  input: ['Hello', 'World', 'TypeScript'],
})
console.log(batchResult.embeddings) // number[][] array
```

**OpenAI Embedding Models:**
- `text-embedding-3-small` - 1536 dimensions, efficient
- `text-embedding-3-large` - 3072 dimensions, most capable
- `text-embedding-ada-002` - 1536 dimensions, legacy

## Multimodal Support

### Image Generation

```typescript
import { openaiImage, generateImage } from '@seashore/llm'

const generator = openaiImage('dall-e-3', {
  apiKey: process.env.OPENAI_API_KEY,
})

const result = await generateImage({
  adapter: generator,
  prompt: 'A serene Japanese garden with cherry blossoms',
  size: '1024x1024',
  quality: 'hd',
})

console.log(result.images[0].url) // Image URL
```

### Vision (Image Understanding)

```typescript
import { openaiText, chat } from '@seashore/llm'

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

### Text-to-Speech

```typescript
import { openaiTTS, generateSpeech } from '@seashore/llm'

const tts = openaiTTS('tts-1', {
  apiKey: process.env.OPENAI_API_KEY,
})

const result = await generateSpeech({
  adapter: tts,
  input: 'Hello, this is a test.',
  voice: 'alloy',
})

// result.audio is an AudioBuffer
```

### Speech-to-Text

```typescript
import { openaiTranscription, transcribeAudio } from '@seashore/llm'

const transcriber = openaiTranscription('whisper-1', {
  apiKey: process.env.OPENAI_API_KEY,
})

const result = await transcribeAudio({
  adapter: transcriber,
  file: audioFile, // File or Blob
  language: 'en',
})

console.log(result.text) // Transcribed text
```

## Error Handling

All adapters throw standardized errors:

```typescript
import { chat } from '@seashore/llm'

try {
  const response = await chat(model, messages)
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limiting
    await delay(1000)
    retry()
  } else if (error.code === 'INVALID_API_KEY') {
    // Handle authentication
  } else {
    // Handle other errors
  }
}
```

## Custom Base URLs

Use custom API endpoints (e.g., for proxies or compatible services):

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

// Local LLM
const model = openaiText('local-model', {
  apiKey: 'not-needed',
  baseURL: 'http://localhost:1234/v1',
})
```

## Best Practices

1. **Environment Variables**: Store API keys in environment variables
2. **Error Handling**: Always handle API errors and implement retries
3. **Token Limits**: Be aware of model context limits
4. **Cost Monitoring**: Track token usage in production
5. **Rate Limiting**: Implement backoff for rate limit errors
6. **Provider Selection**: Choose models based on capabilities and cost
7. **Streaming**: Use streaming for better user experience
8. **Caching**: Cache responses when appropriate

## Choosing a Provider

| Provider | Best For | Strengths |
|----------|----------|-----------|
| OpenAI | General purpose | Most capable, best tool use |
| Anthropic | Long context, analysis | Best for reasoning, 200K context |
| Google | Multimodal | Fast, good for images/video |

## Next Steps

- [OpenAI](./llm/openai.md) - Detailed OpenAI configuration
- [Anthropic](./llm/anthropic.md) - Claude-specific features
- [Google Gemini](./llm/gemini.md) - Gemini configuration
- [Embeddings](./llm/embeddings.md) - Vector embeddings guide
- [Multimodal](./llm/multimodal.md) - Images, audio, video

## Examples

- [01: Basic Agent](../examples/01-basic-agent.md) - Using LLM adapters
- [02: Agent with Tools](../examples/02-agent-tools-stream.md) - Streaming with LLMs
- [04: RAG](../examples/04-basic-rag.md) - Using embeddings

# @seashorelab/llm

LLM adapters and multimodal capabilities for the Seashore Agent Framework.

## Installation

```bash
pnpm add @seashore/llm
```

## Features

- **Text Adapters**: OpenAI, Anthropic, Gemini chat completion
- **Embedding Adapters**: OpenAI and Gemini embeddings
- **Image Generation**: DALL-E and Imagen
- **Video Generation**: Sora
- **Transcription**: Whisper speech-to-text
- **Text-to-Speech**: OpenAI TTS and Gemini TTS

## Usage

### Text Adapters

Text adapters provide **type-safe model names** with IDE auto-completion, while still allowing custom model names:

```typescript
import { openaiText, anthropicText, geminiText, chat } from '@seashorelab/llm';

// Type hints for known models (e.g., 'gpt-4o', 'gpt-4o-mini', 'gpt-4', etc.)
const adapter = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY, // Optional, defaults to env var
  baseURL: 'https://api.openai.com/v1', // Optional, for custom endpoints
});

// Also works with custom/fine-tuned models
const customAdapter = openaiText('ft:gpt-4o-2024-08-06:my-org::AbCdEfGh', {
  apiKey: 'sk-my-key',
});

// Anthropic with type hints
const anthropic = anthropicText('claude-sonnet-4', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com', // Optional
});

// Gemini with type hints
const gemini = geminiText('gemini-2.0-flash', {
  apiKey: process.env.GEMINI_API_KEY,
});

// Use with chat
const response = await chat({
  adapter,
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Access model constants programmatically:**

```typescript
import { 
  OPENAI_CHAT_MODELS, 
  GEMINI_MODELS 
} from '@seashorelab/llm';
import { createAnthropicChat } from '@tanstack/ai-anthropic';

console.log('Available OpenAI models:', OPENAI_CHAT_MODELS);
console.log('Available Gemini models:', GEMINI_MODELS);

// For Anthropic models (not directly exported), extract type from function parameter:
type AnthropicModel = Parameters<typeof createAnthropicChat>[0];
```

### Embedding Adapters

Embedding adapters support optional `apiKey` and `baseURL` configuration:

```typescript
import { openaiEmbed, geminiEmbed, generateEmbedding } from '@seashorelab/llm';

// Default: Uses OPENAI_API_KEY env var and default OpenAI endpoint
const defaultAdapter = openaiEmbed();

// With custom API key
const withApiKey = openaiEmbed('text-embedding-3-small', 256, {
  apiKey: 'sk-my-custom-key',
});

// With custom base URL (for proxies or compatible APIs)
const withBaseUrl = openaiEmbed('text-embedding-3-small', 256, {
  baseURL: 'https://my-proxy.example.com/v1',
});

// With both
const customAdapter = openaiEmbed('text-embedding-3-small', 256, {
  apiKey: 'sk-my-custom-key',
  baseURL: 'https://my-proxy.example.com/v1',
});

// Gemini embeddings work the same way
const geminiAdapter = geminiEmbed('text-embedding-004', undefined, {
  apiKey: 'my-google-api-key',
  baseURL: 'https://custom-gemini-endpoint.example.com/v1beta',
});

// Generate embeddings
const result = await generateEmbedding({
  adapter: customAdapter,
  text: 'Hello, world!',
});
```

### Image Generation

Image adapters also support optional `apiKey` and `baseURL`:

```typescript
import { openaiImage, geminiImage, generateImage } from '@seashorelab/llm';

// Default configuration
const imageAdapter = openaiImage('dall-e-3');

// With custom endpoint
const customImageAdapter = openaiImage('dall-e-3', {
  apiKey: 'sk-my-key',
  baseURL: 'https://my-proxy.example.com/v1',
});

const result = await generateImage({
  adapter: customImageAdapter,
  prompt: 'A beautiful sunset over the ocean',
  size: '1024x1024',
});
```

### Video Generation

```typescript
import { openaiVideo, generateVideo, checkVideoStatus } from '@seashorelab/llm';

const videoAdapter = openaiVideo('sora-2', {
  apiKey: 'sk-my-key',
  baseURL: 'https://my-proxy.example.com/v1',
});

const job = await generateVideo({
  adapter: videoAdapter,
  prompt: 'A cat playing piano',
  duration: 5,
});

// Poll for completion
const status = await checkVideoStatus(job.jobId, videoAdapter);
```

### Transcription

```typescript
import { openaiTranscription, generateTranscription } from '@seashorelab/llm';

const transcriptionAdapter = openaiTranscription('whisper-1', {
  apiKey: 'sk-my-key',
  baseURL: 'https://my-proxy.example.com/v1',
});

const result = await generateTranscription({
  adapter: transcriptionAdapter,
  audio: audioFile,
  language: 'en',
});
```

### Text-to-Speech

```typescript
import { openaiTTS, geminiTTS, generateSpeech } from '@seashorelab/llm';

const ttsAdapter = openaiTTS('tts-1', {
  apiKey: 'sk-my-key',
  baseURL: 'https://my-proxy.example.com/v1',
});

const speech = await generateSpeech({
  adapter: ttsAdapter,
  text: 'Hello, world!',
  voice: 'alloy',
});
```

## Configuration Options

All multimodal adapters (embedding, image, video, transcription, TTS) support the following optional configuration:

| Option | Type | Description |
|--------|------|-------------|
| `apiKey` | `string` | API key for the provider. Falls back to environment variable if not specified. |
| `baseURL` | `string` | Base URL for the API endpoint. Use for proxies, enterprise deployments, or compatible third-party APIs. |

### Environment Variables

If `apiKey` is not provided, the adapters will read from:

- **OpenAI adapters**: `OPENAI_API_KEY`
- **Gemini adapters**: `GOOGLE_API_KEY`

### Default Base URLs

- **OpenAI**: `https://api.openai.com/v1`
- **Gemini**: `https://generativelanguage.googleapis.com/v1beta`

These can be overridden using the `baseURL` option.

## License

MIT

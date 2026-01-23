# @seashorelab/llm

This package provides LLM (including multimodal models) adapters for Seashore. It's a wrapper around @tanstack/ai adapters.

## Text Adapter

Use the following code to create text adapters for OpenAI, Anthropic, and Gemini models.

```ts
import { openaiText, anthropicText, geminiText } from '@seashorelab/llm';

const openaiTextAdapter = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const anthropicTextAdapter = anthropicText('claude-sonnet-4-5', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const geminiTextAdapter = geminiText('gemini-2.5-flash-lite', {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_BASE_URL,
});
```

Each adapter allows you to configure the model, baseURL and API key, so that you can easily switch between different LLM providers or proxies.

Type hints of model names are provided for `model` field.

`apiKey` is a must and no implicit reading from environment variables is done. This is to avoid confusion in different runtime environments.

If no `baseURL` is provided, the adapter will use the default base URL for the official API endpoints.

The returned adapter is standard @tanstack/ai adapter, so there exists some methods that can be called (e.g., `chatStream` and `structuredOutput`), but we usually pass the adapter to Seashore for usage.

## Model Options

Configure model-specific options:

```ts
import { openaiText } from '@seashorelab/llm';

const adapter = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  // Additional model options
  temperature: 0.7,
  maxTokens: 2000,
  topP: 0.9,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1,
});
```

## Embedding

Use the following code to create embedding adapters for OpenAI and Gemini.

```ts
import { openaiEmbed, geminiEmbed } from '@seashorelab/llm';

// 1536 is the dimension of text-embedding-3-small
const openaiEmbeddingAdapter = openaiEmbed('text-embedding-3-small', 1536, {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

const geminiEmbeddingAdapter = geminiEmbed('text-embedding-004', 768, {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_API_BASE_URL,
});
```

@tanstack/ai has already deprecated its embedding adapters, so the returned adapter here is actually a plain object with necessary fields and no methods.

To generate embeddings, you can call the `generateEmbeddings` method.

```ts
import { generateEmbeddings } from '@seashorelab/llm';

const result = await generateEmbeddings({
  adapter: openaiEmbeddingAdapter,
  input: ['Hello world', 'How are you?'],
});

// result.embeddings is an array of number arrays
const embeddings = result.embeddings;
// result.usage contains token usage information
console.log('Tokens used:', result.usage.totalTokens);
```

## Batch Embeddings

Generate embeddings for multiple texts efficiently:

```ts
import { generateBatchEmbeddings } from '@seashorelab/llm';

const texts = [
  'The quick brown fox',
  'jumps over the lazy dog',
  'Pack my box with five dozen liquor jugs',
];

const result = await generateBatchEmbeddings({
  adapter: openaiEmbeddingAdapter,
  input: texts,
});

// Returns embeddings for all texts in one API call
const embeddings = result.embeddings;
```

## Multimodal - Image Generation

Seashore currently supports image generation from OpenAI and Gemini models.

```ts
import { openaiImage, geminiImage, generateImage } from '@seashorelab/llm';

const openaiImageAdapter = openaiImage('dall-e-3', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
});

const geminiImageAdapter = geminiImage('imagen-3.0-generate-002', {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_API_BASE_URL,
});
```

Like embedding adapters, the returned image adapters are plain objects without methods currently.

To generate images, use the `generateImage` method.

```ts
const result = await generateImage({
  adapter: openaiImageAdapter,
  prompt: 'A quick brown fox jumping over the lazy dog',
  // OpenAI-specific options
  size: '1024x1024', // '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality: 'standard', // 'standard' | 'hd'
  n: 1, // Number of images to generate
  // Additional model options
  modelOptions: {},
});

const image = result.images[0];
const urlOrB64 = image.url ?? image.b64Json;
```

## Image Generation Options

### OpenAI DALL-E Options

```ts
await generateImage({
  adapter: openaiImage('dall-e-3', { apiKey: '...' }),
  prompt: 'A serene mountain landscape at sunset',
  size: '1792x1024', // Wide format
  quality: 'hd', // High detail
  style: 'vivid', // 'vivid' | 'natural'
});
```

### Gemini Imagen Options

```ts
await generateImage({
  adapter: geminiImage('imagen-3.0-generate-001', { apiKey: '...' }),
  prompt: 'A futuristic cityscape',
  // Gemini has additional options
  modelOptions: {
    aspectRatio: '16:9',
    negativePrompt: 'blurry, low quality',
  },
});
```

## Structured Output

Get structured JSON responses from LLMs:

```ts
import { openaiText } from '@seashorelab/llm';
import { z } from 'zod';

const adapter = openaiText('gpt-4o', {
  apiKey: process.env.OPENAI_API_KEY,
});

// Define schema for structured output
const schema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number(),
  keywords: z.array(z.string()),
});

// Note: This requires @tanstack/ai's structuredOutput support
// See @tanstack/ai documentation for usage
```

## Streaming Responses

Stream responses token by token:

```ts
import { chatStream } from '@tanstack/ai';

for await (const chunk of chatStream(adapter, messages)) {
  if (chunk.type === 'text-delta') {
    process.stdout.write(chunk.textDelta);
  }
}
```

## Messages Format

The package uses a standard message format:

```ts
import type { Message, ChatMessage } from '@seashorelab/llm';

// Message format for agents
const message: Message = {
  role: 'user',
  content: 'Hello, how are you?',
};

// Chat message format (with tool calls)
const chatMessage: ChatMessage = {
  role: 'assistant',
  content: 'Let me check that for you.',
  toolCalls: [
    {
      id: 'call_123',
      toolName: 'search',
      arguments: '{"query":"weather"}',
    },
  ],
};

// Tool result message
const toolResult: ChatMessage = {
  role: 'tool',
  content: '{"temperature": 72, "condition": "sunny"}',
  toolCallId: 'call_123',
  toolName: 'search',
};
```

## Token Usage

Track token usage for cost monitoring:

```ts
import { generateEmbeddings } from '@seashorelab/llm';

const result = await generateEmbeddings({
  adapter: openaiEmbeddingAdapter,
  input: ['Hello world'],
});

console.log('Prompt tokens:', result.usage.promptTokens);
console.log('Total tokens:', result.usage.totalTokens);

// Estimate cost (example for OpenAI)
const costPer1kTokens = 0.0001; // text-embedding-3-small
const estimatedCost = (result.usage.totalTokens / 1000) * costPer1kTokens;
console.log('Estimated cost:', estimatedCost);
```

## Default Base URLs

Default base URLs for different providers:

```ts
import { OPENAI_DEFAULT_BASE_URL, GEMINI_DEFAULT_BASE_URL } from '@seashorelab/llm';

console.log('OpenAI default:', OPENAI_DEFAULT_BASE_URL); // https://api.openai.com/v1
console.log('Gemini default:', GEMINI_DEFAULT_BASE_URL);
```

## FAQ

You might find a `chat` method from `@tanstack/ai` which accepts a Text Adapter to finish a simple ad-hoc chat request. However, we would suggest you to build an `Agent` first and use it to do the chat instead, so that everything stays in the framework of Seashore.

To sum-up, this package is used to:

- Create text adapters, to be passed to Agents
- Create embedding adapters, and generate embeddings
- Create image generation adapters, and generate images
- Configure model options like temperature, max tokens, etc.
- Track token usage for cost monitoring

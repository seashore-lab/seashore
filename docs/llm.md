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
  size: '1024x1024',
  quality: 'standard',
  n: 1,
  // Additional model options
  modelOptions: {},
});

const image = result.images[0];
const urlOrB64 = image.url ?? image.b64Json;
```

## FAQ

You might find a `chat` method from `@tanstack/ai` which accepts a Text Adapter to finish a simple ad-hoc chat request. However, we would suggest you to build an `Agent` first and use it to do the chat instead, so that everything stays in the framework of Seashore.

To sum-up, this package is used to:

- Create text adapters, to be passed to Agents
- Create embedding adapters, and generate embeddings
- Create image generation adapters, and generate images
- Configure model options like temperature, max tokens, etc.
- Track token usage for cost monitoring

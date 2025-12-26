/**
 * @seashore/llm - Embedding Adapters
 *
 * Embedding vector generation adapters
 */

import type {
  EmbeddingAdapter,
  EmbeddingOptions,
  EmbeddingResult,
  BatchEmbeddingResult,
} from './types';

/**
 * Create an OpenAI embedding adapter
 */
export function openaiEmbed(
  model: string = 'text-embedding-3-small',
  dimensions?: number
): EmbeddingAdapter {
  return {
    provider: 'openai',
    model,
    dimensions,
  };
}

/**
 * Create a Gemini embedding adapter
 */
export function geminiEmbed(
  model: string = 'text-embedding-004',
  dimensions?: number
): EmbeddingAdapter {
  return {
    provider: 'gemini',
    model,
    dimensions,
  };
}

/**
 * Generate embedding for a single text input
 */
export async function generateEmbedding(
  options: EmbeddingOptions
): Promise<EmbeddingResult> {
  const { adapter, input } = options;
  const textInput = Array.isArray(input) ? input[0] : input;

  if (typeof textInput !== 'string') {
    throw new Error('Input must be a string for single embedding generation');
  }

  switch (adapter.provider) {
    case 'openai':
      return generateOpenAIEmbedding(adapter, textInput);
    case 'gemini':
      return generateGeminiEmbedding(adapter, textInput);
    default:
      throw new Error(`Unsupported embedding provider: ${adapter.provider}`);
  }
}

/**
 * Generate embeddings for multiple text inputs
 */
export async function generateBatchEmbeddings(
  options: EmbeddingOptions
): Promise<BatchEmbeddingResult> {
  const { adapter, input } = options;
  const texts = Array.isArray(input) ? input : [input];

  switch (adapter.provider) {
    case 'openai':
      return generateOpenAIBatchEmbeddings(adapter, texts);
    case 'gemini':
      return generateGeminiBatchEmbeddings(adapter, texts);
    default:
      throw new Error(`Unsupported embedding provider: ${adapter.provider}`);
  }
}

// OpenAI embedding implementation
async function generateOpenAIEmbedding(
  adapter: EmbeddingAdapter,
  text: string
): Promise<EmbeddingResult> {
  const apiKey = getEnvVar('OPENAI_API_KEY');

  const body: Record<string, unknown> = {
    model: adapter.model,
    input: text,
  };

  if (adapter.dimensions !== undefined) {
    body['dimensions'] = adapter.dimensions;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding error: ${error}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse;

  return {
    embedding: data.data[0]!.embedding,
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: 0,
      totalTokens: data.usage.total_tokens,
    },
  };
}

async function generateOpenAIBatchEmbeddings(
  adapter: EmbeddingAdapter,
  texts: readonly string[]
): Promise<BatchEmbeddingResult> {
  const apiKey = getEnvVar('OPENAI_API_KEY');

  const body: Record<string, unknown> = {
    model: adapter.model,
    input: texts,
  };

  if (adapter.dimensions !== undefined) {
    body['dimensions'] = adapter.dimensions;
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding error: ${error}`);
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse;

  // Sort by index to maintain order
  const sortedData = [...data.data].sort((a, b) => a.index - b.index);

  return {
    embeddings: sortedData.map((item) => item.embedding),
    model: data.model,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: 0,
      totalTokens: data.usage.total_tokens,
    },
  };
}

// Gemini embedding implementation
async function generateGeminiEmbedding(
  adapter: EmbeddingAdapter,
  text: string
): Promise<EmbeddingResult> {
  const apiKey = getEnvVar('GOOGLE_API_KEY');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${adapter.model}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${adapter.model}`,
        content: {
          parts: [{ text }],
        },
        outputDimensionality: adapter.dimensions,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini embedding error: ${error}`);
  }

  const data = (await response.json()) as GeminiEmbeddingResponse;

  return {
    embedding: data.embedding.values,
    model: adapter.model,
  };
}

async function generateGeminiBatchEmbeddings(
  adapter: EmbeddingAdapter,
  texts: readonly string[]
): Promise<BatchEmbeddingResult> {
  const apiKey = getEnvVar('GOOGLE_API_KEY');

  const requests = texts.map((text) => ({
    model: `models/${adapter.model}`,
    content: {
      parts: [{ text }],
    },
    outputDimensionality: adapter.dimensions,
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${adapter.model}:batchEmbedContents?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini batch embedding error: ${error}`);
  }

  const data = (await response.json()) as GeminiBatchEmbeddingResponse;

  return {
    embeddings: data.embeddings.map((e) => e.values),
    model: adapter.model,
  };
}

// Helper to get environment variable
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Response types
interface OpenAIEmbeddingResponse {
  data: Array<{
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface GeminiEmbeddingResponse {
  embedding: {
    values: number[];
  };
}

interface GeminiBatchEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

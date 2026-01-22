/**
 * @seashorelab/llm - Embedding Adapters
 *
 * Embedding vector generation adapters
 */

import type { EmbeddingAdapter, EmbeddingOptions, BatchEmbeddingResult } from './types';
import { buildOpenAIUrl, buildGeminiUrl } from './utils';

/**
 * Options for configuring embedding adapters
 */
export interface EmbeddingAdapterOptions {
  /** API Key for the provider. */
  apiKey: string;
  /** Base URL for the API endpoint. */
  baseURL?: string;
}

/**
 * Create an OpenAI embedding adapter
 */
export function openaiEmbed(
  model: string,
  dimensions: number,
  options: EmbeddingAdapterOptions
): EmbeddingAdapter {
  return {
    provider: 'openai',
    model,
    dimensions,
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  };
}

/**
 * Create a Gemini embedding adapter
 */
export function geminiEmbed(
  model: string,
  dimensions: number,
  options: EmbeddingAdapterOptions
): EmbeddingAdapter {
  return {
    provider: 'gemini',
    model,
    dimensions,
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  };
}

/**
 * Generate embeddings for multiple text inputs
 */
export async function generateEmbeddings(options: EmbeddingOptions): Promise<BatchEmbeddingResult> {
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

async function generateOpenAIBatchEmbeddings(
  adapter: EmbeddingAdapter,
  texts: readonly string[]
): Promise<BatchEmbeddingResult> {
  const apiKey = adapter.apiKey;

  const body: Record<string, unknown> = {
    model: adapter.model,
    input: texts,
  };

  if (adapter.dimensions !== undefined) {
    body['dimensions'] = adapter.dimensions;
  }

  const url = buildOpenAIUrl(adapter.baseURL, '/embeddings');
  const response = await fetch(url, {
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

async function generateGeminiBatchEmbeddings(
  adapter: EmbeddingAdapter,
  texts: readonly string[]
): Promise<BatchEmbeddingResult> {
  const apiKey = adapter.apiKey;

  const requests = texts.map((text) => ({
    model: `models/${adapter.model}`,
    content: {
      parts: [{ text }],
    },
    outputDimensionality: adapter.dimensions,
  }));

  const url = buildGeminiUrl(adapter.baseURL, adapter.model, 'batchEmbedContents', apiKey);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

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

interface GeminiBatchEmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

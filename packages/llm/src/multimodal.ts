/**
 * @seashorelab/llm - Multimodal Capabilities
 *
 * Image generation
 */

import type { ImageAdapter, ImageGenerationOptions, ImageGenerationResult } from './types';
import { buildOpenAIUrl, buildGeminiUrl } from './utils';

/**
 * Options for configuring multimodal adapters
 */
export interface MultimodalAdapterOptions {
  /**
   * API Key for the provider.
   */
  apiKey: string;
  /**
   * Base URL for the API endpoint.
   */
  baseURL?: string;
}

/**
 * Create an OpenAI image adapter
 * @param model Model name (e.g., 'dall-e-3')
 * @param options Optional configuration for apiKey and baseURL
 */
export function openaiImage(model: string, options: MultimodalAdapterOptions): ImageAdapter {
  return {
    provider: 'openai',
    model,
    apiKey: options.apiKey,
    baseURL: options?.baseURL,
  };
}

/**
 * Create a Gemini image adapter
 * @param model Model name (e.g., 'imagen-3.0-generate-002')
 * @param options Optional configuration for apiKey and baseURL
 */
export function geminiImage(model: string, options: MultimodalAdapterOptions): ImageAdapter {
  return {
    provider: 'gemini',
    model,
    apiKey: options.apiKey,
    baseURL: options?.baseURL,
  };
}

/**
 * Generate images from a text prompt
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { adapter } = options;

  switch (adapter.provider) {
    case 'openai': 
      return generateOpenAIImage(options);
    case 'gemini':
      return generateGeminiImage(options);
    default:
      throw new Error(`Unsupported image provider: ${adapter.provider}`);
  }
}

// OpenAI image generation
async function generateOpenAIImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { adapter, prompt, size, quality, style, n, modelOptions } = options;
  const apiKey = adapter.apiKey;
  const url = buildOpenAIUrl(adapter.baseURL, '/images/generations');

  const body: Record<string, unknown> = {
    model: adapter.model,
    prompt,
    size: size ?? '1024x1024',
    quality: quality ?? 'standard',
    n: n ?? 1,
    ...modelOptions,
  };

  if (style !== undefined) {
    body['style'] = style;
  }

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
    throw new Error(`OpenAI image generation error: ${error}`);
  }

  const data = (await response.json()) as OpenAIImageResponse;

  return {
    id: data.created.toString(),
    model: adapter.model,
    images: data.data.map((img) => ({
      url: img.url,
      b64Json: img.b64_json,
      revisedPrompt: img.revised_prompt,
    })),
  };
}

// Gemini image generation
async function generateGeminiImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const { adapter, prompt, modelOptions } = options;
  const apiKey = adapter.apiKey;
  const url = buildGeminiUrl(adapter.baseURL, adapter.model, 'generateImages', apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      ...modelOptions,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini image generation error: ${error}`);
  }

  const data = (await response.json()) as GeminiImageResponse;

  return {
    id: Date.now().toString(),
    model: adapter.model,
    images: data.generatedImages.map((img) => ({
      b64Json: img.image.imageBytes,
    })),
  };
}

// Response types
interface OpenAIImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

interface GeminiImageResponse {
  generatedImages: Array<{
    image: {
      imageBytes: string;
    };
  }>;
}

/**
 * @seashorelab/llm - Utility Functions
 *
 * Shared utility functions for building API URLs
 */

import { OPENAI_DEFAULT_BASE_URL, GEMINI_DEFAULT_BASE_URL } from './types';

/**
 * Build the full API URL for OpenAI endpoints
 */
export function buildOpenAIUrl(baseURL: string | undefined, path: string): string {
  const base = baseURL ?? OPENAI_DEFAULT_BASE_URL;
  // Remove trailing slash from base and leading slash from path for clean concatenation
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Build the full API URL for Gemini endpoints
 */
export function buildGeminiUrl(
  baseURL: string | undefined,
  model: string,
  action: string,
  apiKey: string
): string {
  const base = baseURL ?? GEMINI_DEFAULT_BASE_URL;
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}/models/${model}:${action}?key=${apiKey}`;
}

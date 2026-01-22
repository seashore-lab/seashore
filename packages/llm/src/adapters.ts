/**
 * @seashorelab/llm - Text Adapters
 *
 * Text generation adapters with baseURL support for all providers
 */

import { createOpenaiChat } from '@tanstack/ai-openai';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import { createGeminiChat, GeminiTextModels } from '@tanstack/ai-gemini';

/**
 * Create an OpenAI text adapter with custom configuration
 * @param model - Model ID (e.g., 'gpt-5.1'). Supports type hints for known models and custom strings.
 * @param options - Configuration options including apiKey, baseURL, and organization
 */
export function openaiText(
  model: Parameters<typeof createOpenaiChat>[0] | (string & {}),
  options: {
    apiKey: string;
    baseURL?: string;
    organization?: string;
  }
) {
  return createOpenaiChat(model as any, options.apiKey, {
    baseURL: options.baseURL,
    organization: options.organization,
  });
}

/**
 * Create an Anthropic text adapter with custom configuration
 * Uses createAnthropicChat for baseURL support
 * @param model - Model ID (e.g., 'claude-sonnet-4-5'). Supports type hints for known models and custom strings.
 * @param options - Configuration options including apiKey and baseURL
 */
export function anthropicText(
  model: Parameters<typeof createAnthropicChat>[0] | (string & {}),
  options: {
    apiKey: string;
    baseURL?: string;
  }
) {
  return createAnthropicChat(model as any, options.apiKey, {
    baseURL: options?.baseURL,
  });
}

/**
 * Create a Gemini text adapter with custom configuration
 * Uses createGeminiChat for baseURL support
 * @param model - Model ID (e.g., 'gemini-2.5-flash-lite'). Supports type hints for known models and custom strings.
 * @param options - Configuration options including apiKey and baseURL
 */
export function geminiText(
  model: (typeof GeminiTextModels)[number] | (string & {}),
  options: {
    apiKey: string;
    baseURL?: string;
  }
) {
  return createGeminiChat(model as any, options.apiKey, {
    baseURL: options?.baseURL,
  });
}

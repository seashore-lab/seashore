/**
 * @seashore/llm - Text Adapters
 *
 * Text generation adapters with baseURL support for all providers
 */

import { createOpenaiChat, OPENAI_CHAT_MODELS } from '@tanstack/ai-openai';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import { createGeminiChat, GeminiTextModels } from '@tanstack/ai-gemini';

// Re-export core chat functions
export { chat } from '@tanstack/ai';

/**
 * Create an OpenAI text adapter with custom configuration
 * @param model - Model ID (e.g., 'gpt-4o'). Supports type hints for known models and custom strings.
 * @param options - Configuration options including apiKey, baseURL, and organization
 */
export function openaiText(
  model: (typeof OPENAI_CHAT_MODELS)[number] | (string & {}),
  options?: {
    apiKey?: string;
    baseURL?: string;
    organization?: string;
  }
) {
  return createOpenaiChat(model as any, options?.apiKey ?? process.env.OPENAI_API_KEY ?? '', {
    baseURL: options?.baseURL,
    organization: options?.organization,
  });
}

/**
 * Create an Anthropic text adapter with custom configuration
 * Uses createAnthropicChat for baseURL support
 * @param model - Model ID (e.g., 'claude-sonnet-4'). Supports type hints for known models and custom strings.
 * @param options - Configuration options including apiKey and baseURL
 */
export function anthropicText(
  model: Parameters<typeof createAnthropicChat>[0] | (string & {}),
  options?: {
    apiKey?: string;
    baseURL?: string;
  }
) {
  return createAnthropicChat(model as any, options?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '', {
    baseURL: options?.baseURL,
  });
}

/**
 * Create a Gemini text adapter with custom configuration
 * Uses createGeminiChat for baseURL support
 * @param model - Model ID (e.g., 'gemini-2.0-flash'). Supports type hints for known models and custom strings.
 * @param options - Configuration options including apiKey and baseURL
 */
export function geminiText(
  model: (typeof GeminiTextModels)[number] | (string & {}),
  options?: {
    apiKey?: string;
    baseURL?: string;
  }
) {
  return createGeminiChat(model as any, options?.apiKey ?? process.env.GEMINI_API_KEY ?? '', {
    baseURL: options?.baseURL,
  });
}

/**
 * @seashorelab/llm
 *
 * LLM adapters and multimodal support for Seashore Agent Framework
 */

export { chat as _chat } from '@tanstack/ai';

// Types
export type {
  Message,
  MessageRole,
  ChatMessage,
  ChatMessageRole,
  ToolCall,
  TokenUsage,
  StreamChunk,
  StreamChunkType,
  TextAdapter,
  AnyTextAdapter,
  ImageAdapter,
  EmbeddingAdapter,
  ImageGenerationResult,
  ImageOutput,
  BatchEmbeddingResult,
  ChatOptions,
  ImageGenerationOptions,
  EmbeddingOptions,
} from './types';

// Constants
export { OPENAI_DEFAULT_BASE_URL, GEMINI_DEFAULT_BASE_URL } from './types';

// Utility functions
export { isChatMessage, filterChatMessages } from './types';

// Text adapters
export { openaiText, anthropicText, geminiText } from './adapters';

// Note: ANTHROPIC_MODELS is not exported by @tanstack/ai-anthropic, use Parameters<typeof createAnthropicChat>[0] for type extraction
export { GeminiTextModels as GEMINI_MODELS } from '@tanstack/ai-gemini';

// Embedding adapters
export {
  openaiEmbed,
  geminiEmbed,
  generateEmbeddings,
  type EmbeddingAdapterOptions,
} from './embedding';

// Multimodal adapters
export {
  // Image
  openaiImage,
  geminiImage,
  generateImage,
  // Types
  type MultimodalAdapterOptions,
} from './multimodal';

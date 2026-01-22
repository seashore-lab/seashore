/**
 * @seashorelab/llm - Types
 *
 * Core type definitions for LLM adapters and operations
 */

/**
 * Non-system message role
 */
export type ChatMessageRole = 'user' | 'assistant' | 'tool';

/**
 * Message role types
 */
export type MessageRole = ChatMessageRole | 'system';

/**
 * Tool call within a message
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Chat message structure
 */
export interface Message {
  role: MessageRole;
  content?: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

/**
 * Chat message (excludes system role, compatible with @tanstack/ai)
 */
export interface ChatMessage {
  role: ChatMessageRole;
  content: string | null;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

/**
 * Type guard to check if a message is a chat message (not system)
 */
export function isChatMessage(message: Message): message is Message & { role: ChatMessageRole } {
  return message.role !== 'system';
}

/**
 * Filter messages to only include chat messages (non-system)
 */
export function filterChatMessages(messages: Message[]): ChatMessage[] {
  return messages.filter(isChatMessage).map((msg) => ({
    role: msg.role as ChatMessageRole,
    content: msg.content ?? null, // Convert undefined to null for @tanstack/ai
    toolCalls: msg.toolCalls ? [...msg.toolCalls] : undefined,
    toolCallId: msg.toolCallId,
    name: msg.name,
  }));
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Stream chunk types - aligned with @tanstack/ai
 */
export type StreamChunkType =
  | 'content'
  | 'tool_call'
  | 'tool_result'
  | 'done'
  | 'error'
  | 'approval-requested'
  | 'tool-input-available'
  | 'thinking';

/**
 * Stream chunk error (compatible with @tanstack/ai)
 */
export interface StreamChunkError {
  readonly message: string;
  readonly name?: string;
  readonly code?: string;
}

/**
 * Stream chunk emitted during generation
 */
export interface StreamChunk {
  readonly type: StreamChunkType;
  readonly delta?: string;
  readonly toolCall?: Partial<ToolCall>;
  readonly finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter' | null;
  readonly usage?: TokenUsage;
  readonly error?: StreamChunkError;
}

/**
 * Text generation adapter interface
 * Re-exported from @tanstack/ai for type compatibility
 */
import type {
  TextAdapter as TanstackTextAdapter,
  AnyTextAdapter as TanstackAnyTextAdapter,
  Tool as TanstackTool,
} from '@tanstack/ai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TextAdapter = TanstackTextAdapter<any, any, any, any>;
export type AnyTextAdapter = TanstackAnyTextAdapter;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tool = TanstackTool<any, any, any>;

/**
 * Default base URL for OpenAI API
 */
export const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';

/**
 * Default base URL for Gemini API
 */
export const GEMINI_DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Image generation adapter interface
 */
export interface ImageAdapter {
  provider: 'openai' | 'gemini';
  model: string;
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
 * Embedding adapter interface
 */
export interface EmbeddingAdapter {
  provider: 'openai' | 'gemini';
  model: string;
  dimensions?: number | undefined;
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
 * Image generation result
 */
export interface ImageGenerationResult {
  id: string;
  model: string;
  images: ImageOutput[];
  usage?: TokenUsage;
}

/**
 * Single image output
 */
export interface ImageOutput {
  url?: string;
  b64Json?: string;
  revisedPrompt?: string;
}

/**
 * Batch embedding result
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  usage?: TokenUsage;
}

/**
 * Chat options
 */
export interface ChatOptions {
  adapter: AnyTextAdapter;
  messages: Message[];
  tools?: unknown[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  signal?: AbortSignal;
}

/**
 * Image generation options
 */
export interface ImageGenerationOptions {
  adapter: ImageAdapter;
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  modelOptions?: Record<string, unknown>;
}

/**
 * Embedding options
 */
export interface EmbeddingOptions {
  adapter: EmbeddingAdapter;
  input: string[];
}

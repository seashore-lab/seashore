/**
 * @seashore/llm - LLM 适配层接口契约
 *
 * 基于 @tanstack/ai 构建，提供统一的 LLM 调用接口
 */

import type { ChatAdapter, Message } from '@tanstack/ai'

// ============================================================================
// Provider Types
// ============================================================================

/**
 * 支持的 LLM Provider
 */
export type LLMProvider = 'openai' | 'anthropic' | 'gemini'

/**
 * Provider 配置
 */
export interface ProviderConfig {
  openai?: {
    apiKey: string
    baseURL?: string
  }
  anthropic?: {
    apiKey: string
  }
  gemini?: {
    apiKey: string
  }
}

// ============================================================================
// Client Types
// ============================================================================

/**
 * LLM 客户端配置
 */
export interface LLMClientConfig {
  provider: LLMProvider
  model: string
  apiKey?: string
  baseURL?: string
}

/**
 * LLM 客户端实例
 */
export interface LLMClient {
  readonly provider: LLMProvider
  readonly model: string

  /**
   * 获取底层 @tanstack/ai adapter
   */
  getAdapter(): ChatAdapter

  /**
   * 聊天补全（流式）
   */
  chat(options: ChatOptions): AsyncIterable<ChatStreamChunk>

  /**
   * 聊天补全（非流式）
   */
  chatComplete(options: ChatOptions): Promise<ChatCompletionResult>
}

/**
 * 聊天选项
 */
export interface ChatOptions {
  messages: Message[]
  systemPrompt?: string
  tools?: unknown[]
  maxTokens?: number
  temperature?: number
  abortSignal?: AbortSignal
}

/**
 * 流式响应块
 */
export interface ChatStreamChunk {
  type: 'text' | 'tool-call' | 'thinking' | 'done'
  content?: string
  toolCall?: {
    id: string
    name: string
    arguments: unknown
  }
}

/**
 * 完整响应结果
 */
export interface ChatCompletionResult {
  content: string
  toolCalls?: Array<{
    id: string
    name: string
    arguments: unknown
  }>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建 LLM 客户端
 *
 * @example
 * ```typescript
 * import { createLLMClient } from "@seashore/llm";
 *
 * const client = createLLMClient({
 *   provider: "openai",
 *   model: "gpt-4o",
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 *
 * const response = await client.chatComplete({
 *   messages: [{ role: "user", content: "Hello!" }],
 * });
 * ```
 */
export function createLLMClient(config: LLMClientConfig): LLMClient

/**
 * 获取 Provider 的可用模型列表
 */
export function getAvailableModels(provider: LLMProvider): string[]

// ============================================================================
// Re-exports from @tanstack/ai
// ============================================================================

export type { Message, ChatAdapter } from '@tanstack/ai'

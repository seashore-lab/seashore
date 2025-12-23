/**
 * @seashore/tool - 工具定义接口契约
 *
 * 基于 @tanstack/ai 的 toolDefinition() 构建
 */

import type { z } from 'zod'

// ============================================================================
// Tool Definition Types
// ============================================================================

/**
 * 工具定义配置
 */
export interface ToolConfig<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
> {
  name: string
  description: string
  inputSchema: TInput
  outputSchema?: TOutput
}

/**
 * 工具定义实例
 */
export interface ToolDefinition<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType
> {
  readonly name: string
  readonly description: string
  readonly inputSchema: TInput
  readonly outputSchema?: TOutput

  /**
   * 创建服务端工具实现
   */
  server<TResult = z.infer<TOutput>>(
    handler: (input: z.infer<TInput>) => Promise<TResult> | TResult
  ): ServerTool<TInput, TOutput, TResult>

  /**
   * 创建客户端工具实现
   */
  client<TResult = z.infer<TOutput>>(
    handler: (input: z.infer<TInput>) => Promise<TResult> | TResult
  ): ClientTool<TInput, TOutput, TResult>
}

/**
 * 服务端工具
 */
export interface ServerTool<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
  TResult = z.infer<TOutput>
> {
  readonly type: 'server'
  readonly name: string
  readonly description: string
  readonly inputSchema: TInput
  readonly outputSchema?: TOutput
  execute(input: z.infer<TInput>): Promise<TResult>
}

/**
 * 客户端工具
 */
export interface ClientTool<
  TInput extends z.ZodType = z.ZodType,
  TOutput extends z.ZodType = z.ZodType,
  TResult = z.infer<TOutput>
> {
  readonly type: 'client'
  readonly name: string
  readonly description: string
  readonly inputSchema: TInput
  readonly outputSchema?: TOutput
  execute(input: z.infer<TInput>): Promise<TResult>
}

/**
 * 工具类型联合
 */
export type Tool = ServerTool | ClientTool

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 定义工具
 *
 * @example
 * ```typescript
 * import { defineTool } from "@seashore/tool";
 * import { z } from "zod";
 *
 * const searchToolDef = defineTool({
 *   name: "search",
 *   description: "Search the web for information",
 *   inputSchema: z.object({
 *     query: z.string().describe("Search query"),
 *   }),
 *   outputSchema: z.object({
 *     results: z.array(z.object({
 *       title: z.string(),
 *       url: z.string(),
 *       snippet: z.string(),
 *     })),
 *   }),
 * });
 *
 * // 服务端实现
 * const searchTool = searchToolDef.server(async ({ query }) => {
 *   const results = await performSearch(query);
 *   return { results };
 * });
 * ```
 */
export function defineTool<TInput extends z.ZodType, TOutput extends z.ZodType>(
  config: ToolConfig<TInput, TOutput>
): ToolDefinition<TInput, TOutput>

// ============================================================================
// Preset Tools
// ============================================================================

/**
 * Serper Web 搜索工具配置
 */
export interface SerperToolConfig {
  apiKey: string
  country?: string
  locale?: string
  maxResults?: number
}

/**
 * 创建 Serper 搜索工具
 *
 * @example
 * ```typescript
 * import { createSerperTool } from "@seashore/tool";
 *
 * const searchTool = createSerperTool({
 *   apiKey: process.env.SERPER_API_KEY,
 * });
 * ```
 */
export function createSerperTool(config: SerperToolConfig): ServerTool

/**
 * Firecrawl 网页抓取工具配置
 */
export interface FirecrawlToolConfig {
  apiKey: string
  maxDepth?: number
  timeout?: number
}

/**
 * 创建 Firecrawl 抓取工具
 *
 * @example
 * ```typescript
 * import { createFirecrawlTool } from "@seashore/tool";
 *
 * const crawlTool = createFirecrawlTool({
 *   apiKey: process.env.FIRECRAWL_API_KEY,
 * });
 * ```
 */
export function createFirecrawlTool(config: FirecrawlToolConfig): ServerTool

// ============================================================================
// Re-exports from @tanstack/ai
// ============================================================================

export { toolDefinition } from '@tanstack/ai'

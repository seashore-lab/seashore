/**
 * @seashore/genui - 生成式 UI 接口契约
 *
 * 基于 React 18 + @tanstack/ai-react
 * 使用 Tool Call 驱动的生成式 UI 模式
 */

import type { ReactNode, ComponentType } from 'react'

// ============================================================================
// Component Types
// ============================================================================

/**
 * 聊天 UI 配置
 */
export interface ChatUIConfig {
  /**
   * API 端点
   */
  endpoint: string

  /**
   * 初始消息
   */
  initialMessages?: ChatMessage[]

  /**
   * 系统提示词
   */
  systemPrompt?: string

  /**
   * 自定义组件渲染器
   */
  componentRegistry?: ComponentRegistry

  /**
   * 主题配置
   */
  theme?: ThemeConfig

  /**
   * 回调函数
   */
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Error) => void
  onFinish?: () => void
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  parts?: MessagePart[]
  createdAt: Date
}

/**
 * 消息部分
 */
export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | {
      type: 'tool-call'
      id: string
      name: string
      arguments: unknown
      state: ToolCallState
    }
  | { type: 'tool-result'; toolCallId: string; name: string; result: unknown }
  | { type: 'ui'; component: string; props: Record<string, unknown> }

/**
 * 工具调用状态
 */
export type ToolCallState =
  | 'awaiting-input'
  | 'input-streaming'
  | 'input-complete'
  | 'executing'
  | 'complete'
  | 'error'

/**
 * 主题配置
 */
export interface ThemeConfig {
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: string
  fontFamily?: string
}

// ============================================================================
// Component Registry (生成式 UI 核心)
// ============================================================================

/**
 * 组件注册表
 */
export interface ComponentRegistry {
  /**
   * 注册组件
   */
  register<P extends Record<string, unknown>>(
    name: string,
    component: ComponentType<P>,
    schema?: unknown // Zod schema for props validation
  ): void

  /**
   * 获取组件
   */
  get(name: string): ComponentType<Record<string, unknown>> | undefined

  /**
   * 检查组件是否存在
   */
  has(name: string): boolean

  /**
   * 列出所有组件
   */
  list(): string[]
}

/**
 * 创建组件注册表
 *
 * @example
 * ```typescript
 * import { createComponentRegistry } from "@seashore/genui";
 *
 * const registry = createComponentRegistry();
 *
 * registry.register("chart", ChartComponent, z.object({
 *   data: z.array(z.number()),
 *   title: z.string(),
 * }));
 *
 * registry.register("table", TableComponent, z.object({
 *   columns: z.array(z.string()),
 *   rows: z.array(z.array(z.unknown())),
 * }));
 * ```
 */
export function createComponentRegistry(): ComponentRegistry

// ============================================================================
// React Components
// ============================================================================

/**
 * 完整聊天 UI 组件
 *
 * @example
 * ```tsx
 * import { ChatUI } from "@seashore/genui";
 *
 * function App() {
 *   return (
 *     <ChatUI
 *       endpoint="/api/chat"
 *       componentRegistry={registry}
 *       theme={{ primaryColor: "#0066cc" }}
 *     />
 *   );
 * }
 * ```
 */
export const ChatUI: ComponentType<ChatUIConfig>

/**
 * 消息列表组件 Props
 */
export interface MessageListProps {
  messages: ChatMessage[]
  componentRegistry?: ComponentRegistry
  renderMessage?: (message: ChatMessage, index: number) => ReactNode
  className?: string
}

/**
 * 消息列表组件
 */
export const MessageList: ComponentType<MessageListProps>

/**
 * 消息气泡组件 Props
 */
export interface MessageBubbleProps {
  message: ChatMessage
  componentRegistry?: ComponentRegistry
  className?: string
}

/**
 * 消息气泡组件
 */
export const MessageBubble: ComponentType<MessageBubbleProps>

/**
 * 输入框组件 Props
 */
export interface InputBoxProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

/**
 * 输入框组件
 */
export const InputBox: ComponentType<InputBoxProps>

/**
 * 生成式 UI 渲染器 Props
 */
export interface GenUIRendererProps {
  /**
   * 要渲染的组件名称
   */
  component: string

  /**
   * 组件 Props
   */
  props: Record<string, unknown>

  /**
   * 组件注册表
   */
  registry: ComponentRegistry

  /**
   * 错误回退组件
   */
  fallback?: ReactNode
}

/**
 * 生成式 UI 渲染器
 *
 * 根据 Tool Call 返回的组件定义动态渲染 React 组件
 *
 * @example
 * ```tsx
 * import { GenUIRenderer } from "@seashore/genui";
 *
 * function MessageContent({ part }) {
 *   if (part.type === "tool-result" && part.name === "renderUI") {
 *     return (
 *       <GenUIRenderer
 *         component={part.result.component}
 *         props={part.result.props}
 *         registry={registry}
 *         fallback={<div>Unknown component</div>}
 *       />
 *     );
 *   }
 *   // ...
 * }
 * ```
 */
export const GenUIRenderer: ComponentType<GenUIRendererProps>

// ============================================================================
// React Hooks
// ============================================================================

/**
 * useChat 配置
 */
export interface UseChatConfig {
  endpoint: string
  initialMessages?: ChatMessage[]
  tools?: unknown[]
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Error) => void
  onFinish?: () => void
}

/**
 * useChat 返回值
 */
export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: Error | null
  sendMessage: (content: string) => void
  reload: () => void
  stop: () => void
  setMessages: (messages: ChatMessage[]) => void
}

/**
 * 聊天 Hook
 *
 * 封装 @tanstack/ai-react 的 useChat，提供更便捷的 API
 *
 * @example
 * ```typescript
 * import { useSeashoreChat } from "@seashore/genui";
 *
 * function Chat() {
 *   const { messages, sendMessage, isLoading } = useSeashoreChat({
 *     endpoint: "/api/chat",
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(m => <MessageBubble key={m.id} message={m} />)}
 *       <InputBox onSend={sendMessage} disabled={isLoading} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useSeashoreChat(config: UseChatConfig): UseChatReturn

// ============================================================================
// Tool Definition for GenUI
// ============================================================================

/**
 * 渲染 UI 工具输入
 */
export interface RenderUIInput {
  component: string
  props: Record<string, unknown>
}

/**
 * 创建渲染 UI 工具定义
 *
 * 在服务端配置此工具，Agent 可以通过调用此工具返回 UI 组件定义
 *
 * @example
 * ```typescript
 * import { createRenderUITool } from "@seashore/genui";
 *
 * const renderUITool = createRenderUITool({
 *   allowedComponents: ["chart", "table", "card"],
 * });
 *
 * const agent = createReActAgent({
 *   llm,
 *   tools: [renderUITool],
 * });
 * ```
 */
export function createRenderUITool(config?: {
  allowedComponents?: string[]
  description?: string
}): unknown // ServerTool

// ============================================================================
// Markdown Rendering
// ============================================================================

/**
 * Markdown 渲染器 Props
 */
export interface MarkdownRendererProps {
  content: string
  className?: string
  codeHighlight?: boolean
}

/**
 * Markdown 渲染器组件
 */
export const MarkdownRenderer: ComponentType<MarkdownRendererProps>

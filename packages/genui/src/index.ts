/**
 * @seashorelab/genui - Generative UI components for Seashore Agent framework
 * @module @seashorelab/genui
 *
 * @example Basic chat usage
 * ```tsx
 * import { Chat } from '@seashorelab/genui'
 * import '@seashorelab/genui/styles.css'
 *
 * function App() {
 *   return (
 *     <Chat
 *       endpoint="/api/chat"
 *       placeholder="Ask me anything..."
 *       welcomeMessage="Hello! How can I help you today?"
 *     />
 *   )
 * }
 * ```
 *
 * @example Custom GenUI components
 * ```tsx
 * import { Chat, createGenUIRegistry } from '@seashorelab/genui'
 *
 * const registry = createGenUIRegistry()
 *
 * registry.register('show_weather', {
 *   component: ({ data }) => (
 *     <div className="weather-card">
 *       <span>{data.icon}</span>
 *       <span>{data.temperature}°C</span>
 *     </div>
 *   ),
 * })
 *
 * function App() {
 *   return <Chat endpoint="/api/chat" genUIRegistry={registry} />
 * }
 * ```
 */

// React Components
export { Chat, ChatMessages, ChatInput, ChatMessage, ChatToolResult } from './components/index';

// Hooks
export {
  useChat,
  useChatStream,
  type UseChatOptions,
  type UseChatReturn,
  type UseChatStreamOptions,
  type UseChatStreamReturn,
} from './hooks/index';

// Registry
export { createGenUIRegistry, isGenUIData } from './registry';

// Renderer
export { renderToolCall, createToolCallRenderer } from './renderer';

// Types
export type {
  MessageRole,
  ToolCall,
  ToolCallResult,
  ChatMessage as ChatMessageType,
  ChatResponse,
  TokenUsage,
  StreamChunk,
  ToolCallUI,
  GenUIData,
  ComponentRendererProps,
  ComponentRenderer,
  GenUIRegistry,
  ToolCallRenderResult,
  ChatProps,
  ChatMessagesProps,
  ChatInputProps,
  ChatMessageProps,
  ChatToolResultProps,
} from './types';

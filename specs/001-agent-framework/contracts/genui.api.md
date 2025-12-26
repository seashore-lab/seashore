# API Contract: @seashore/genui

**Package**: `@seashore/genui`  
**Version**: 0.1.0

## 概述

GenUI 模块基于 Tool Call 机制实现生成式 UI，提供完整的聊天组件套件和自定义渲染器注册能力。

---

## 导出

```typescript
// React 组件
export {
  Chat,
  ChatMessages,
  ChatInput,
  ChatMessage,
  ChatToolResult,
  type ChatProps,
} from './components'

// Hooks
export {
  useChat,
  useChatStream,
  type UseChatOptions,
  type UseChatReturn,
} from './hooks'

// GenUI 注册
export {
  createGenUIRegistry,
  type GenUIRegistry,
  type ComponentRenderer,
} from './registry'

// Tool Call 渲染
export {
  renderToolCall,
  createToolCallRenderer,
  type ToolCallRenderResult,
} from './renderer'

// 类型
export type { ChatMessage, ToolCallUI, GenUIComponent } from './types'
```

---

## Chat 组件套件

### Chat

完整的聊天界面组件：

```tsx
import { Chat } from '@seashore/genui'

function App() {
  return (
    <Chat
      endpoint="/api/chat"
      // 可选配置
      placeholder="输入消息..."
      welcomeMessage="你好！我是 AI 助手"
      // 样式
      className="h-screen"
      theme="light"
      // 事件
      onMessageSend={(message) => console.log('Sent:', message)}
      onResponse={(response) => console.log('Response:', response)}
      onError={(error) => console.error('Error:', error)}
    />
  )
}
```

### ChatMessages

消息列表组件：

```tsx
import { ChatMessages, ChatMessage } from '@seashore/genui'

function CustomChat() {
  const messages: ChatMessage[] = [
    { id: '1', role: 'user', content: 'Hello!' },
    { id: '2', role: 'assistant', content: 'Hi there!' },
  ]

  return (
    <ChatMessages
      messages={messages}
      // 自定义渲染
      renderMessage={(message) => (
        <div className={message.role === 'user' ? 'text-right' : 'text-left'}>
          {message.content}
        </div>
      )}
      // 加载状态
      isLoading={false}
      loadingIndicator={<div>Thinking...</div>}
      // 滚动
      autoScroll={true}
    />
  )
}
```

### ChatInput

输入组件：

```tsx
import { ChatInput } from '@seashore/genui'

function CustomInput() {
  return (
    <ChatInput
      onSubmit={(content) => console.log('Submit:', content)}
      placeholder="输入消息..."
      disabled={false}
      // 多行输入
      multiline={true}
      maxRows={5}
      // 附件
      allowAttachments={true}
      acceptedFileTypes={['image/*', '.pdf']}
      onAttachment={(file) => console.log('Attachment:', file)}
      // 快捷键
      submitOnEnter={true}
      submitOnShiftEnter={false}
    />
  )
}
```

---

## useChat Hook

### 基本用法

```tsx
import { useChat } from '@seashore/genui'

function ChatComponent() {
  const { messages, input, setInput, sendMessage, isLoading, error, stop, reload } =
    useChat({
      endpoint: '/api/chat',
    })

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage()
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        {isLoading && (
          <button type="button" onClick={stop}>
            Stop
          </button>
        )}
      </form>

      {error && <div className="error">{error.message}</div>}
    </div>
  )
}
```

### 配置选项

```typescript
interface UseChatOptions {
  // API 端点
  endpoint: string

  // 请求配置
  headers?: Record<string, string>
  credentials?: RequestCredentials

  // 初始状态
  initialMessages?: ChatMessage[]
  initialInput?: string

  // Thread 管理
  threadId?: string
  onThreadCreate?: (threadId: string) => void

  // 事件回调
  onMessage?: (message: ChatMessage) => void
  onToolCall?: (toolCall: ToolCall) => void
  onFinish?: (response: ChatResponse) => void
  onError?: (error: Error) => void

  // GenUI 注册表
  genUIRegistry?: GenUIRegistry

  // 流式配置
  streamProtocol?: 'sse' | 'text'
}
```

### 返回值

```typescript
interface UseChatReturn {
  // 消息状态
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void

  // 输入状态
  input: string
  setInput: (input: string) => void

  // 操作
  sendMessage: (content?: string) => Promise<void>
  stop: () => void
  reload: () => Promise<void>
  clearMessages: () => void

  // 状态
  isLoading: boolean
  error: Error | null

  // Thread
  threadId: string | null

  // 附件
  attachments: File[]
  setAttachments: (files: File[]) => void
}
```

---

## GenUI 注册表

### createGenUIRegistry

基于 Tool Call 的组件注册：

```tsx
import { createGenUIRegistry } from '@seashore/genui'

const registry = createGenUIRegistry()

// 注册股票卡片组件
registry.register('show_stock', {
  component: ({ data }) => (
    <div className="stock-card">
      <h3>{data.symbol}</h3>
      <p className="price">${data.price}</p>
      <p className={data.change > 0 ? 'text-green' : 'text-red'}>
        {data.change > 0 ? '+' : ''}
        {data.change}%
      </p>
    </div>
  ),
  // 可选：加载状态
  loading: () => <div className="skeleton">Loading stock...</div>,
  // 可选：错误状态
  error: ({ error }) => (
    <div className="error">Failed to load stock: {error.message}</div>
  ),
})

// 注册天气卡片
registry.register('show_weather', {
  component: ({ data }) => (
    <div className="weather-card">
      <div className="icon">{data.icon}</div>
      <div className="temp">{data.temperature}°C</div>
      <div className="condition">{data.condition}</div>
    </div>
  ),
})

// 注册图表组件
registry.register('show_chart', {
  component: ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.points}>
        <XAxis dataKey="date" />
        <YAxis />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  ),
})
```

### 在 Chat 中使用

```tsx
import { Chat } from '@seashore/genui'

function App() {
  return <Chat endpoint="/api/chat" genUIRegistry={registry} />
}
```

---

## 服务端 Tool 定义

### 定义 UI Tool

```typescript
import { defineTool } from '@seashore/tool'

// 股票查询 Tool（返回 UI）
const showStockTool = defineTool({
  name: 'show_stock',
  description: '显示股票信息卡片',
  inputSchema: z.object({
    symbol: z.string().describe('股票代码'),
  }),
  execute: async ({ symbol }) => {
    const stock = await fetchStockData(symbol)
    return {
      // 返回数据供前端渲染
      __genui: true,
      data: {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.changePercent,
      },
    }
  },
})

// 天气 Tool
const showWeatherTool = defineTool({
  name: 'show_weather',
  description: '显示天气信息',
  inputSchema: z.object({
    city: z.string().describe('城市名称'),
  }),
  execute: async ({ city }) => {
    const weather = await fetchWeather(city)
    return {
      __genui: true,
      data: {
        city: weather.city,
        temperature: weather.temp,
        condition: weather.condition,
        icon: weather.iconEmoji,
      },
    }
  },
})
```

### Agent 配置

```typescript
import { createAgent } from '@seashore/agent'

const agent = createAgent({
  name: 'ui-agent',
  adapter: openaiText('gpt-4o'),
  tools: [showStockTool, showWeatherTool, showChartTool],
  systemPrompt: `你是一个助手，可以显示股票、天气和图表信息。
当用户询问股票时，使用 show_stock 工具。
当用户询问天气时，使用 show_weather 工具。`,
})
```

---

## Tool Call 渲染

### renderToolCall

手动渲染 Tool Call 结果：

```tsx
import { renderToolCall } from '@seashore/genui'

function MessageWithTools({ message, registry }) {
  return (
    <div className="message">
      <p>{message.content}</p>

      {message.toolCalls?.map((toolCall) => (
        <div key={toolCall.id} className="tool-result">
          {renderToolCall(toolCall, registry)}
        </div>
      ))}
    </div>
  )
}
```

### createToolCallRenderer

创建自定义渲染器：

```tsx
import { createToolCallRenderer } from '@seashore/genui'

const renderer = createToolCallRenderer({
  registry,

  // 默认渲染（未注册的 tool）
  defaultRenderer: ({ toolCall }) => (
    <pre className="json-view">{JSON.stringify(toolCall.result, null, 2)}</pre>
  ),

  // 包装器
  wrapper: ({ children, toolCall }) => (
    <div className="tool-card">
      <div className="tool-name">{toolCall.function.name}</div>
      {children}
    </div>
  ),
})

// 使用
const ui = renderer.render(toolCall)
```

---

## 流式 UI 更新

### 渐进式渲染

```tsx
import { useChatStream } from '@seashore/genui'

function StreamingChat() {
  const { messages, streamingMessage, isStreaming, sendMessage } = useChatStream({
    endpoint: '/api/chat',
    genUIRegistry: registry,
  })

  return (
    <div>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} registry={registry} />
      ))}

      {isStreaming && streamingMessage && (
        <Message message={streamingMessage} registry={registry} isStreaming />
      )}
    </div>
  )
}
```

### 工具执行状态

```tsx
registry.register('search', {
  // 执行中状态
  loading: ({ input }) => (
    <div className="search-loading">
      <Spinner />
      <span>正在搜索 "{input.query}"...</span>
    </div>
  ),

  // 完成状态
  component: ({ data }) => (
    <div className="search-results">
      {data.results.map((result) => (
        <a key={result.url} href={result.url}>
          <h4>{result.title}</h4>
          <p>{result.snippet}</p>
        </a>
      ))}
    </div>
  ),
})
```

---

## 主题和样式

### 内置主题

```tsx
<Chat
  theme="light" // 'light' | 'dark' | 'system'
  accentColor="#0066cc"
  borderRadius="lg" // 'none' | 'sm' | 'md' | 'lg' | 'full'
/>
```

### CSS 变量

```css
:root {
  --genui-bg: #ffffff;
  --genui-text: #1a1a1a;
  --genui-border: #e5e5e5;
  --genui-accent: #0066cc;
  --genui-user-bg: #0066cc;
  --genui-user-text: #ffffff;
  --genui-assistant-bg: #f5f5f5;
  --genui-assistant-text: #1a1a1a;
  --genui-radius: 12px;
}

.dark {
  --genui-bg: #1a1a1a;
  --genui-text: #ffffff;
  --genui-border: #333333;
  /* ... */
}
```

### 完全自定义

```tsx
import { ChatMessages, ChatInput, useChat } from '@seashore/genui'

function CustomChat() {
  const chat = useChat({ endpoint: '/api/chat' })

  return (
    <div className="my-custom-chat">
      <MyCustomHeader />

      <ChatMessages
        messages={chat.messages}
        renderMessage={(msg) => <MyCustomMessage message={msg} />}
      />

      <MyCustomInput
        value={chat.input}
        onChange={chat.setInput}
        onSubmit={chat.sendMessage}
      />
    </div>
  )
}
```

---

## 类型定义

```typescript
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  toolCalls?: ToolCall[]
  toolCallId?: string
  createdAt?: Date
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
  result?: unknown
}

export interface ToolCallUI {
  __genui: true
  data: unknown
}

export interface ComponentRenderer<T = unknown> {
  component: React.FC<{ data: T; toolCall: ToolCall }>
  loading?: React.FC<{ input: unknown }>
  error?: React.FC<{ error: Error }>
}

export interface GenUIRegistry {
  register<T>(toolName: string, renderer: ComponentRenderer<T>): void
  unregister(toolName: string): void
  get(toolName: string): ComponentRenderer | undefined
  has(toolName: string): boolean
}

export interface ChatProps {
  endpoint: string
  headers?: Record<string, string>
  placeholder?: string
  welcomeMessage?: string
  theme?: 'light' | 'dark' | 'system'
  className?: string
  genUIRegistry?: GenUIRegistry
  onMessageSend?: (content: string) => void
  onResponse?: (response: ChatMessage) => void
  onError?: (error: Error) => void
}
```

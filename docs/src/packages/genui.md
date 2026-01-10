# @seashore/genui

Generative UI components for agent-powered interfaces.

## Installation

```bash
pnpm add @seashore/genui
```

Required peer dependencies:
```bash
pnpm add react react-dom
```

## Overview

`@seashore/genui` provides:

- React chat components (Chat, ChatMessages, ChatInput)
- useChat hook for state management
- GenUI registry for tool-based component rendering
- Streaming UI updates
- Theme and styling support

## Quick Start

### Basic Chat Component

```tsx
import { Chat } from '@seashore/genui'

function App() {
  return (
    <Chat
      endpoint="/api/chat"
      placeholder="Type a message..."
      welcomeMessage="Hello! How can I help you today?"
    />
  )
}
```

### Using useChat Hook

```tsx
import { useChat } from '@seashore/genui'

function ChatComponent() {
  const { messages, input, setInput, sendMessage, isLoading } = useChat({
    endpoint: '/api/chat',
  })

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role}>
          {msg.content}
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage() }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </form>
    </div>
  )
}
```

## API Reference

### Chat Component

Complete chat interface component.

```tsx
<Chat
  endpoint="/api/chat"
  placeholder="Type a message..."
  welcomeMessage="Hello!"
  theme="light"
  className="h-screen"
  onMessageSend={(message) => console.log('Sent:', message)}
  onResponse={(response) => console.log('Response:', response)}
  onError={(error) => console.error('Error:', error)}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `endpoint` | `string` | Yes | API endpoint |
| `placeholder` | `string` | No | Input placeholder |
| `welcomeMessage` | `string` | No | Initial greeting |
| `theme` | `'light' \| 'dark' \| 'system'` | No | Color theme |
| `className` | `string` | No | CSS class |
| `genUIRegistry` | `GenUIRegistry` | No | Component registry |
| `onMessageSend` | `(content: string) => void` | No | Send callback |
| `onResponse` | `(response: ChatMessage) => void` | No | Response callback |
| `onError` | `(error: Error) => void` | No | Error callback |

### ChatMessages Component

Message list component.

```tsx
<ChatMessages
  messages={messages}
  renderMessage={(message) => (
    <div className={message.role === 'user' ? 'text-right' : 'text-left'}>
      {message.content}
    </div>
  )}
  isLoading={false}
  loadingIndicator={<div>Thinking...</div>}
  autoScroll={true}
/>
```

### ChatInput Component

Input component.

```tsx
<ChatInput
  onSubmit={(content) => console.log('Submit:', content)}
  placeholder="Type a message..."
  disabled={false}
  multiline={true}
  maxRows={5}
  allowAttachments={true}
  acceptedFileTypes={['image/*', '.pdf']}
  submitOnEnter={true}
/>
```

## useChat Hook

### Return Values

```typescript
interface UseChatReturn {
  // Messages
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void

  // Input
  input: string
  setInput: (input: string) => void

  // Actions
  sendMessage: (content?: string) => Promise<void>
  stop: () => void
  reload: () => Promise<void>
  clearMessages: () => void

  // State
  isLoading: boolean
  error: Error | null

  // Thread
  threadId: string | null

  // Attachments
  attachments: File[]
  setAttachments: (files: File[]) => void
}
```

### Configuration Options

```typescript
interface UseChatOptions {
  endpoint: string
  headers?: Record<string, string>
  credentials?: RequestCredentials
  initialMessages?: ChatMessage[]
  initialInput?: string
  threadId?: string
  onThreadCreate?: (threadId: string) => void
  onMessage?: (message: ChatMessage) => void
  onToolCall?: (toolCall: ToolCall) => void
  onFinish?: (response: ChatResponse) => void
  onError?: (error: Error) => void
  genUIRegistry?: GenUIRegistry
  streamProtocol?: 'sse' | 'text'
}
```

## GenUI Registry

### createGenUIRegistry

Register tool-based components.

```tsx
import { createGenUIRegistry } from '@seashore/genui'

const registry = createGenUIRegistry()

// Register stock card
registry.register('show_stock', {
  component: ({ data }) => (
    <div className="stock-card">
      <h3>{data.symbol}</h3>
      <p className="price">${data.price}</p>
      <p className={data.change > 0 ? 'text-green' : 'text-red'}>
        {data.change > 0 ? '+' : ''}{data.change}%
      </p>
    </div>
  ),
  loading: () => <div className="skeleton">Loading...</div>,
  error: ({ error }) => (
    <div className="error">Failed: {error.message}</div>
  ),
})

// Register weather card
registry.register('show_weather', {
  component: ({ data }) => (
    <div className="weather-card">
      <div className="icon">{data.icon}</div>
      <div className="temp">{data.temperature}°C</div>
      <div className="condition">{data.condition}</div>
    </div>
  ),
})
```

### Using Registry with Chat

```tsx
<Chat endpoint="/api/chat" genUIRegistry={registry} />
```

## Server-Side Tool Definition

### Creating UI Tools

```typescript
import { defineTool } from '@seashore/tool'

const showStockTool = defineTool({
  name: 'show_stock',
  description: 'Display stock information card',
  inputSchema: z.object({
    symbol: z.string().describe('Stock symbol'),
  }),
  execute: async ({ symbol }) => {
    const stock = await fetchStockData(symbol)
    return {
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
```

### Agent Configuration

```typescript
import { createAgent } from '@seashore/agent'

const agent = createAgent({
  name: 'ui-agent',
  adapter: openaiText('gpt-4o'),
  tools: [showStockTool, showWeatherTool],
  systemPrompt: `You are an assistant that can display stock and weather information.
Use show_stock for stock queries.
Use show_weather for weather queries.`,
})
```

## Tool Call Rendering

### renderToolCall

Manual rendering of tool calls.

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

Custom renderer configuration.

```tsx
import { createToolCallRenderer } from '@seashore/genui'

const renderer = createToolCallRenderer({
  registry,
  defaultRenderer: ({ toolCall }) => (
    <pre className="json-view">
      {JSON.stringify(toolCall.result, null, 2)}
    </pre>
  ),
  wrapper: ({ children, toolCall }) => (
    <div className="tool-card">
      <div className="tool-name">{toolCall.function.name}</div>
      {children}
    </div>
  ),
})
```

## Streaming UI Updates

### useChatStream

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

## Theme and Styling

### Built-in Themes

```tsx
<Chat
  theme="light" // 'light' | 'dark' | 'system'
  accentColor="#0066cc"
  borderRadius="lg" // 'none' | 'sm' | 'md' | 'lg' | 'full'
/>
```

### CSS Variables

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
}
```

## Best Practices

1. **Register components** before mounting Chat
2. **Handle loading states** for better UX
3. **Use streaming** for real-time feedback
4. **Customize themes** to match your app
5. **Handle errors** gracefully

## See Also

- [Agent Package](agent.md)
- [Tool Package](tool.md)
- [Deploy Package](deploy.md)

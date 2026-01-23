# @seashorelab/genui

This package provides React components and hooks for building generative UI interfaces with Seashore agents. It includes chat components, streaming support, and tool result rendering.

## Chat Component

The main chat component for AI conversations:

```tsx
import { Chat } from '@seashorelab/genui';
import '@seashorelab/genui/styles.css';

function App() {
  return (
    <Chat
      endpoint="/api/chat"
      placeholder="Ask me anything..."
      welcomeMessage="Hello! How can I help you today?"
      showTimestamps={true}
      autoFocus={true}
    />
  );
}
```

## useChat Hook

Use the chat hook for custom UI:

```tsx
import { useChat } from '@seashorelab/genui';

function CustomChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    endpoint: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Message completed:', message);
    },
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <span>{message.role}: </span>
          <span>{message.content}</span>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

## Streaming Chat

Stream responses token by token:

```tsx
import { useChatStream } from '@seashorelab/genui';

function StreamingChat() {
  const { messages, input, handleInputChange, handleSubmit, streamState } = useChatStream({
    endpoint: '/api/chat/stream',
    onToken: (token) => {
      console.log('Received token:', token);
    },
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role}: </strong>
          <p>{message.content}</p>
          {message.toolCalls && (
            <div>
              Used tools: {message.toolCalls.map(t => t.name).join(', ')}
            </div>
          )}
        </div>
      ))}

      {/* Show streaming indicator */}
      {streamState.isStreaming && (
        <div className="streaming-indicator">
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </div>
      )}
    </div>
  );
}
```

## Chat Messages Component

Use individual components for custom layouts:

```tsx
import { ChatMessages, ChatInput, ChatMessage } from '@seashorelab/genui';

function CustomLayout() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="chat-container">
      <div className="messages">
        <ChatMessages
          messages={messages}
          renderMessage={(message) => (
            <ChatMessage
              key={message.id}
              message={message}
              showAvatar={true}
              showTimestamp={true}
            />
          )}
        />
      </div>

      <div className="input-area">
        <ChatInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder="Type your message..."
          disabled={false}
        />
      </div>
    </div>
  );
}
```

## Tool Call Rendering

Render tool call results:

```tsx
import { renderToolCall, createGenUIRegistry } from '@seashorelab/genui';

// Create registry for custom component rendering
const registry = createGenUIRegistry();

// Register custom renderer for specific tool
registry.register('search', {
  component: SearchResults,
  parse: (data) => JSON.parse(data),
});

// Use in chat
function ChatWithToolRendering() {
  const { messages } = useChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <p>{message.content}</p>

          {/* Render tool calls */}
          {message.toolCalls?.map((toolCall) => (
            <div key={toolCall.id}>
              <h4>{toolCall.name}</h4>
              {renderToolCall(toolCall, registry)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Custom component for search results
function SearchResults({ data }: { data: { results: Array<{ title: string, url: string }> } }) {
  return (
    <ul>
      {data.results.map((result, i) => (
        <li key={i}>
          <a href={result.url}>{result.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

## Message Types

Handle different message types:

```tsx
import { ChatMessage } from '@seashorelab/genui';

function MessageItem({ message }: { message: ChatMessage }) {
  return (
    <div className={`message message-${message.role}`}>
      {message.role === 'user' && <UserAvatar />}
      {message.role === 'assistant' && <BotAvatar />}

      <div className="message-content">
        <p>{message.content}</p>

        {/* Show tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="tool-calls">
            {message.toolCalls.map((toolCall) => (
              <div key={toolCall.id} className="tool-call">
                <span className="tool-name">{toolCall.name}</span>
                <pre className="tool-args">{toolCall.arguments}</pre>
              </div>
            ))}
          </div>
        )}

        {/* Show timestamp */}
        {message.createdAt && (
          <span className="timestamp">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
```

## Custom Styling

Apply custom styles:

```tsx
import { Chat } from '@seashorelab/genui';
import './custom-chat.css';

function StyledChat() {
  return (
    <Chat
      endpoint="/api/chat"
      className="my-custom-chat"
      messageClassName="my-message"
      inputClassName="my-input"
      containerClassName="my-container"
    />
  );
}
```

```css
/* custom-chat.css */
.my-custom-chat {
  --chat-bg: #f5f5f5;
  --message-bg: #ffffff;
  --user-message-bg: #007bff;
  --user-message-text: #ffffff;
  --border-radius: 12px;
}

.my-message {
  padding: 12px 16px;
  margin-bottom: 8px;
}

.my-message[data-role="user"] {
  background-color: var(--user-message-bg);
  color: var(--user-message-text);
  margin-left: auto;
  max-width: 70%;
}

.my-message[data-role="assistant"] {
  background-color: var(--message-bg);
  border: 1px solid #e0e0e0;
  margin-right: auto;
  max-width: 70%;
}
```

## Multi-Turn Conversations

Maintain conversation context:

```tsx
function ConversationChat() {
  const { messages, input, handleInputChange, handleSubmit, reset } = useChat({
    endpoint: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I remember you from our last conversation.',
      },
    ],
  });

  return (
    <div>
      <button onClick={reset}>Start New Conversation</button>

      <div>
        {messages.map((message) => (
          <div key={message.id}>{message.content}</div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

## Attachment Support

Handle file attachments:

```tsx
import { useChat } from '@seashorelab/genui';

function ChatWithAttachments() {
  const { messages, input, handleInputChange, handleSubmit, attachments, setAttachments } = useChat();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  return (
    <div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            {message.attachments?.map((att, i) => (
              <img key={i} src={URL.createObjectURL(att)} alt="attachment" />
            ))}
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc"
        />
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Error Handling

Handle chat errors gracefully:

```tsx
function ErrorHandlingChat() {
  const { messages, input, handleInputChange, handleSubmit, error, retry } = useChat({
    endpoint: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error);
      // Show toast notification
      toast.error('Failed to send message');
    },
  });

  return (
    <div>
      {error && (
        <div className="error-message">
          <p>{error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}

      <div>
        {messages.map((message) => (
          <div key={message.id}>{message.content}</div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

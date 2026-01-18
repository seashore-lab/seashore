# Chat Interface

## Full UI

```tsx
import { Chat } from '@seashore/genui'

export function App() {
  return <Chat endpoint="/api/chat" welcomeMessage="Hello!" />
}
```

## Hook-based UI

```tsx
import { useChat } from '@seashore/genui'

export function MinimalChat() {
  const { messages, input, setInput, sendMessage, isLoading } = useChat({
    endpoint: '/api/chat',
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void sendMessage()
      }}
    >
      <pre>{JSON.stringify(messages, null, 2)}</pre>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button disabled={isLoading}>Send</button>
    </form>
  )
}
```

# Streaming UI

For responsive UIs, consume server streaming (typically SSE) and update message state incrementally.

GenUI provides `useChatStream` to simplify streaming protocols.

When combined with `@seashore/deploy` streaming endpoints, you can render:

- partial assistant text
- tool calls as they occur
- tool results as interactive UI blocks

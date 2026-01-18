# Persistence Middleware

In production you usually want persistence as a cross-cutting concern:

- record user messages
- record assistant outputs
- record tool calls/results
- record traces/metrics

Seashore’s storage layer provides repositories; you can compose them into middleware for your app server or workflow runner.

Typical approach:

1. Create a `threadId` per conversation.
2. Persist every inbound/outbound message.
3. Persist tool calls and tool results.
4. Use traces for observability (see Production → Observability).

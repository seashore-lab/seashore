# Thread Continuation

Thread continuation means:

- take an existing thread
- load recent messages
- construct a prompt/context window
- continue the conversation coherently

In practice:

1. Load messages by `threadId` (ordered ascending).
2. Create a condensed context (possibly via memory summarization).
3. Pass the context into the agent.

Use this when you build chat apps or long-running assistants.

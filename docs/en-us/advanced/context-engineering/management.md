# Context Management

Context management is the operational side of context engineering:

- decide budgets (tokens) per section: system prompt, history, RAG, tool results
- apply trimming/summarization when budgets exceed thresholds
- log what was included for debugging and evaluation

In production, pair this with tracing and token counting.

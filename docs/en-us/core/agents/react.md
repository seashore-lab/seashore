# ReAct Agents

Seashore's default agent implementation is a **ReAct** agent (Reasoning + Acting). In practice, it is a loop that:

1. Sends the current conversation state to the LLM.
2. Lets the LLM decide whether to call a tool.
3. Executes tool calls (if any) and feeds results back as `tool` messages.
4. Repeats until the model returns a final answer or `maxIterations` is reached.

This pattern is implemented in `packages/agent/src/react-agent.ts`.

## When to Use

- You want a single agent that can autonomously decide *when* to use tools.
- You want streaming output and tool-call events.
- You prefer a simple mental model over explicit orchestration.

If you need strict multi-step control and explicit branching, consider a workflow (see [Workflows](../workflows.md)).

## Tool Calling Lifecycle

During a run, the stream can contain tool events:

- `tool-call-start`: a tool call begins (id + tool name)
- `tool-call-args`: tool arguments (as JSON string)
- `tool-call-end`: tool call is fully specified
- `tool-result`: tool executed; result is attached

See [Streaming Responses](./streaming.md) for the exact chunk shapes.

## Example

The runnable example [examples/src/02-agent-with-tools-and-stream.ts](../../examples/02-agent-tools-stream.md) demonstrates:

- defining tools via `defineTool`
- attaching them to a ReAct agent
- consuming the streaming event stream

## Guardrails and Production Controls

ReAct agents are powerful, but in production you typically add:

- **Tool approval** (for risky tools): [Tool Approval](../tools/approval.md)
- **Security guardrails** (prompt injection / PII): [Security](../../production/security.md)
- **Observability** (tracing + token usage): [Observability](../../production/observability.md)

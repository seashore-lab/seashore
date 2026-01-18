# Client-Side Tools

Some tools are safest when executed **on the client** (browser/app) instead of the server:

- file system operations
- privileged user data access
- payment actions

In those cases:

1. Let the agent *propose* a tool call.
2. Present the request to the user.
3. Execute it client-side.
4. Send the result back as a `tool` message.

Seashore's streaming events (`tool-call-start` / `tool-call-args` / `tool-call-end`) are designed to support this pattern.

If you need an explicit approval flow for server-side tools, see [Tool Approval](./approval.md).

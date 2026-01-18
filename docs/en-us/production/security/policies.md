# Security Policies

Decide policies explicitly:

- What is blocked vs redacted vs warned?
- How do you handle tool calls that fetch external content?
- Do you record violations for later analysis?

Recommended:

- apply input checks before tool execution
- apply output checks before returning to the user
- store violation metadata in traces/logs

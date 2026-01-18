# Tool Approval

For sensitive tools (web scraping, shell execution, payments, etc.), you often want an approval step.

Seashore provides an approval wrapper and an in-memory approval handler via `@seashore/tool`.

## Example (Firecrawl with Approval)

This is demonstrated end-to-end in [examples/src/11-tool-presets.ts](../../examples/11-tool-presets.md).

Conceptually:

1. Wrap a tool with `withApproval(tool, { handler, riskLevel, reason })`.
2. The handler receives a pending request.
3. Approve or reject.

## Common Policies

- Auto-approve for low-risk, read-only operations
- Require user approval for:
  - network scraping
  - executing shell commands
  - writing to disk

Pair this with [Security Guardrails](../../production/security.md) to reduce prompt-injection risk.

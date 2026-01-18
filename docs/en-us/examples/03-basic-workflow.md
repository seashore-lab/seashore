# Example 03: Basic Workflow

Source: `examples/src/03-basic-workflow.ts`

## What it demonstrates

- Creating a multi-step workflow with two LLM nodes
- Passing data between nodes via `WorkflowContext`
- Running workflows in `execute()` mode and `stream()` mode

## How to run

```bash
pnpm --filter @seashorelab/examples exec tsx src/03-basic-workflow.ts
```

## Key concepts

- Workflows overview: [core/workflows.md](../core/workflows.md)
- Execution events: [core/workflows/execution.md](../core/workflows/execution.md)

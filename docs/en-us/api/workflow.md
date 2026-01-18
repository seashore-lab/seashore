# API Reference: Workflow

Package: `@seashore/workflow`

## Creating workflows

- `createWorkflow({ name, nodes, edges, startNode })`

## Node types

- `createLLMNode({ name, model, systemPrompt, prompt|messages })`

## Execution

- `workflow.execute(input)` runs end-to-end
- `workflow.stream(input)` yields events (workflow_start, node_start, llm_token, ...)

See:

- [core/workflows.md](../core/workflows.md)
- [examples/03-basic-workflow.md](../examples/03-basic-workflow.md)

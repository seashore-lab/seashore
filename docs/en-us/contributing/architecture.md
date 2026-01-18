# Architecture

Seashore is organized as a layered set of packages inside `packages/`.

## Package layers (typical)

- Foundation: storage, tool
- LLM layer: llm, vectordb
- Agent layer: workflow, agent
- Specialized: rag, memory, security, mcp, observability, evaluation, deploy, genui, contextengineering

## Design goals

- provider-agnostic LLM adapters
- type-safe tool interfaces (schema-driven)
- composable agent/workflow building blocks
- production-oriented add-ons (observability, evaluation, security, deploy)

## Where to look

- Agent implementation: `packages/agent/src/`
- Workflow engine: `packages/workflow/src/`
- Tool system: `packages/tool/src/`

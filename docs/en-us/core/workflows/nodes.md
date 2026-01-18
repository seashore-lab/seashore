# Workflow Nodes

Seashore exposes several node constructors (see the API contract in `specs/001-agent-framework/contracts/workflow.api.md`).

Common ones:

- LLM nodes (`createLLMNode`)
- tool nodes (`createToolNode`)
- condition/router nodes
- parallel nodes
- custom nodes

The runnable example set currently focuses on LLM nodes; tool routing can be layered in the same way you attach tools to agents.

# Agent Nodes

In more advanced workflows you can embed agents as nodes.

Typical patterns:

- Node A classifies the task (LLM)
- Node B calls a specialized agent for research
- Node C calls a specialized agent for writing

If you need strict boundaries between responsibilities, this often yields better reliability than a single monolithic ReAct agent.

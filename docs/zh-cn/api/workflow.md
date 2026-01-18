# API 参考：工作流

包：`@seashore/workflow`

## 创建工作流

- `createWorkflow({ name, nodes, edges, startNode })`

## 节点类型

- `createLLMNode({ name, model, systemPrompt, prompt|messages })`

## 执行

- `workflow.execute(input)` 端到端运行
- `workflow.stream(input)` 产生事件（workflow_start、node_start、llm_token 等）

参见：

- [core/workflows.md](../core/workflows.md)
- [examples/03-basic-workflow.md](../examples/03-basic-workflow.md)

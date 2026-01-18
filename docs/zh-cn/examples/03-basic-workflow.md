# 示例 03：基础工作流

源文件：`examples/src/03-basic-workflow.ts`

## 演示内容

- 创建包含两个 LLM 节点的多步骤工作流
- 通过 `WorkflowContext` 在节点之间传递数据
- 在 `execute()` 模式和 `stream()` 模式下运行工作流

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/03-basic-workflow.ts
```

## 核心概念

- 工作流概述：[core/workflows.md](../core/workflows.md)
- 执行事件：[core/workflows/execution.md](../core/workflows/execution.md)

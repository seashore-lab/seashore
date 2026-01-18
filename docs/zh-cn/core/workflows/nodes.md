# 工作流节点

Seashore 公开了几个节点构造函数（请参阅 `specs/001-agent-framework/contracts/workflow.api.md` 中的 API 契约）。

常见的有：

- 大语言模型节点（`createLLMNode`）
- 工具节点（`createToolNode`）
- 条件/路由节点
- 并行节点
- 自定义节点

可运行的示例集目前专注于大语言模型节点；工具路由可以像将工具附加到智能体一样分层。

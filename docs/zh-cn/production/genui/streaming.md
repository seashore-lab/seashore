# 流式 UI

对于响应式 UI，消费服务器流（通常是 SSE）并增量更新消息状态。

GenUI 提供 `useChatStream` 来简化流协议。

当与 `@seashorelab/deploy` 流式端点结合时，您可以渲染：

- 部分助手文本
- 工具调用发生时
- 作为交互式 UI 块的工具结果

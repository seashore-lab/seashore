# ReAct 智能体

Seashore 的默认智能体实现是 **ReAct** 智能体（推理 + 行动）。实际上，它是一个循环，执行以下操作：

1. 将当前对话状态发送给大语言模型。
2. 让大语言模型决定是否调用工具。
3. 执行工具调用（如果有）并将结果作为 `tool` 消息反馈。
4. 重复直到模型返回最终答案或达到 `maxIterations`。

此模式在 `packages/agent/src/react-agent.ts` 中实现。

## 何时使用

- 您需要一个能够自主决定*何时*使用工具的单一智能体。
- 您希望流式输出和工具调用事件。
- 您更喜欢简单的心智模型而不是显式编排。

如果您需要严格的多步控制和显式分支，请考虑使用工作流（参见[工作流](../workflows.md)）。

## 工具调用生命周期

在运行期间，流可以包含工具事件：

- `tool-call-start`：工具调用开始（id + 工具名称）
- `tool-call-args`：工具参数（作为 JSON 字符串）
- `tool-call-end`：工具调用完全指定
- `tool-result`：工具已执行；结果已附加

有关确切的块形状，请参阅[流式响应](./streaming.md)。

## 示例

可运行的示例 [examples/src/02-agent-with-tools-and-stream.ts](../../examples/02-agent-tools-stream.md) 演示了：

- 通过 `defineTool` 定义工具
- 将它们附加到 ReAct 智能体
- 消费流事件流

## 防护栏和生产控制

ReAct 智能体很强大，但在生产环境中通常需要添加：

- **工具审批**（用于风险工具）：[工具审批](../tools/approval.md)
- **安全防护栏**（提示注入 / 个人身份信息）：[安全](../../production/security.md)
- **可观测性**（追踪 + Token 使用）：[可观测性](../../production/observability.md)

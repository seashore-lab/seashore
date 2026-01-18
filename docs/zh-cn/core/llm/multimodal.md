# 多模态支持

`@seashorelab/llm` 还公开了用于多模态任务的适配器：

- 图像生成（例如 DALL·E、Imagen）
- 视频生成（例如 Sora）
- 转录（语音转文本）
- 文本转语音

这在规范契约 `specs/001-agent-framework/contracts/llm.api.md` 中描述。

如果您正在构建需要多模态的产品功能，最好将多模态适配器隔离在工具或工作流节点之后，以使智能体提示词保持较小。

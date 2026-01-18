# API 参考：工具

包：`@seashorelab/tool`

## 定义工具

- `defineTool({ name, description, inputSchema, execute })`

工具使用 Zod 输入模式描述；Seashore 将其转换为模型可以调用的工具模式。

参见：

- [core/tools/defining.md](../core/tools/defining.md)
- [examples/02-agent-tools-stream.md](../examples/02-agent-tools-stream.md)

## 预设工具

工具包提供了预设工具：

- Serper 搜索、Firecrawl 爬取
- DuckDuckGo、Wikipedia、GitHub、金融、arXiv、文章提取
- 受限 shell

参见：

- [core/tools/presets.md](../core/tools/presets.md)
- [examples/11-tool-presets.md](../examples/11-tool-presets.md)
- [examples/15-new-preset-tools.md](../examples/15-new-preset-tools.md)

## 审批

- `withApproval(tool, options)`
- `createMemoryApprovalHandler()`

参见：[core/tools/approval.md](../core/tools/approval.md)

# 示例 11：工具预设

源文件：`examples/src/11-tool-presets.ts`

## 演示内容

- 使用预设工具（Serper 搜索 + Firecrawl 抓取）
- 使用审批工作流包装工具（`withApproval`）
- 在流式输出时处理工具调用生命周期事件

## 前置要求

- `SERPER_API_KEY`
- `FIRECRAWL_API_KEY`

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/11-tool-presets.ts
```

## 核心概念

- 工具预设：[core/tools/presets.md](../core/tools/presets.md)
- 工具审批：[core/tools/approval.md](../core/tools/approval.md)

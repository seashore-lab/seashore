# 示例 06：基础 MCP

源文件：`examples/src/06-basic-mcp.ts`

## 演示内容

- 通过 stdio 连接到 MCP 服务器
- 将 MCP 工具桥接到 Seashore 工具
- 创建可以在本地文件系统上操作的 agent

## 前置要求

- Node.js
- 可用 `npx`
- 根据模型/提供商：某些 MCP 工具调用功能可能需要兼容 OpenAI 的"Responses API"。

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/06-basic-mcp.ts
```

## 核心概念

- MCP 概述：[advanced/mcp.md](../advanced/mcp.md)
- 客户端：[advanced/mcp/client.md](../advanced/mcp/client.md)
- 工具桥接：[advanced/mcp/tools.md](../advanced/mcp/tools.md)

# Research: Examples 可运行示例集

**Date**: 2025-12-29  
**Status**: Completed

## Research Questions

### Q1: 如何在 pnpm workspace 中设置 examples 子项目？

**Decision**: 将 `examples` 添加到 `pnpm-workspace.yaml`，使用 `workspace:*` 协议链接依赖

**Rationale**:
- pnpm workspace 支持通过 `workspace:*` 协议链接本地包
- 无需发布包，直接使用本地源码
- 修改 packages/* 后，examples 立即生效

**Alternatives considered**:
- npm link: 需要手动维护链接，容易出错
- 发布到 npm: 增加发布流程复杂度
- 相对路径导入: 不符合真实使用场景

### Q2: examples 项目的 package.json 结构？

**Decision**: 创建标准 ESM 项目，脚本使用 tsx 运行 TypeScript

**Rationale**:
- `tsx` 是现代 TypeScript 运行器，支持 ESM
- 无需编译即可运行
- 开发体验好

**Implementation**:
```json
{
  "name": "@seashore/examples",
  "type": "module",
  "scripts": {
    "01-basic-agent": "tsx src/01-basic-agent.ts",
    ...
  },
  "dependencies": {
    "@seashore/agent": "workspace:*",
    "@seashore/llm": "workspace:*",
    ...
  },
  "devDependencies": {
    "tsx": "^4.x",
    "dotenv": "^16.x"
  }
}
```

### Q3: 如何处理环境变量（API Keys）？

**Decision**: 使用 dotenv 加载 `.env` 文件

**Rationale**:
- 标准的环境变量管理方式
- 安全，不会提交敏感信息
- 简单易用

**Implementation**:
- 提供 `.env.example` 作为模板
- 在每个示例开头加载 dotenv

### Q4: 各模块的实际导出情况验证

**Decision**: 基于 packages/*/src/index.ts 的实际导出

**Verified exports**:

| Package | Key Exports |
|---------|-------------|
| @seashore/agent | `createAgent` |
| @seashore/llm | `openaiText`, `anthropicText`, `geminiText`, `chat` |
| @seashore/tool | `defineTool`, `zodToJsonSchema`, `serperTool`, `firecrawlTool` |
| @seashore/workflow | `createWorkflow`, `createLLMNode`, `createConditionNode` |
| @seashore/rag | `createRAG`, `createVectorRetriever`, `createInMemoryRetriever`, loaders, splitters |
| @seashore/memory | `createShortTermMemory`, `createMemoryManager`, `withMemory` |
| @seashore/mcp | `createMCPClient`, `createMCPToolBridge` |
| @seashore/security | `createGuardrails`, `promptInjectionRule`, `piiDetectionRule`, `toxicityRule` |
| @seashore/evaluation | `createEvaluator`, `evaluate`, `relevanceMetric` |
| @seashore/observability | `createTracer`, `createTokenCounter`, `createLogger` |
| @seashore/deploy | `createServer`, `createChatHandler` |

### Q5: OpenAI 模型配置最佳实践？

**Decision**: 使用 `openaiText('gpt-4o')` 配合环境变量

**Rationale**:
- gpt-4o 是当前最新的多模态模型
- 通过 OPENAI_API_KEY 环境变量自动获取 key
- 符合 TanStack AI 的推荐用法

## Dependencies for Examples

```json
{
  "dependencies": {
    "@seashore/agent": "workspace:*",
    "@seashore/llm": "workspace:*",
    "@seashore/tool": "workspace:*",
    "@seashore/workflow": "workspace:*",
    "@seashore/rag": "workspace:*",
    "@seashore/memory": "workspace:*",
    "@seashore/mcp": "workspace:*",
    "@seashore/security": "workspace:*",
    "@seashore/evaluation": "workspace:*",
    "@seashore/observability": "workspace:*",
    "@seashore/deploy": "workspace:*",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "tsx": "^4.19.4",
    "dotenv": "^16.4.7",
    "typescript": "^5.8.3",
    "@types/node": "^22.15.21"
  }
}
```

## Conclusion

所有研究问题已解决，无 NEEDS CLARIFICATION 项。可以进入 Phase 1。

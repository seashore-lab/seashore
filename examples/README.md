# Seashore Examples

可运行的示例集，展示 Seashore Agent Framework 的各种功能。

## 快速开始

### 1. 安装依赖

```bash
# 从仓库根目录
pnpm install
pnpm build
```

### 2. 配置环境变量

```bash
cd examples
cp .env.example .env
# 编辑 .env，填入你的 API Keys
```

### 3. 运行示例

```bash
# 从根目录
pnpm --filter @seashore/examples run 01-basic-agent

# 或在 examples 目录
pnpm run 01-basic-agent
```

## 示例列表

### 🎯 P1 核心示例（入门必看）

| # | 示例 | 描述 | 模块 |
|---|------|------|------|
| 01 | [basic-agent](src/01-basic-agent.ts) | 最简单的 Agent，直接对话 | agent, llm |
| 02 | [agent-with-tools](src/02-agent-with-tools.ts) | 带工具的 Agent（天气+计算器） | agent, llm, tool |
| 03 | [streaming-response](src/03-streaming-response.ts) | 流式响应，打字机效果 | agent, llm |

### 🚀 P2 进阶示例

| # | 示例 | 描述 | 模块 |
|---|------|------|------|
| 04 | [multi-tool-agent](src/04-multi-tool-agent.ts) | 多工具协作（搜索+模拟抓取） | agent, llm, tool |
| 05 | [workflow-basic](src/05-workflow-basic.ts) | 两步工作流（大纲→正文） | workflow, llm |
| 06 | [rag-knowledge-base](src/06-rag-knowledge-base.ts) | RAG 知识库问答（内存存储） | rag, llm |
| 07 | [memory-conversation](src/07-memory-conversation.ts) | 带记忆的多轮对话 | agent, llm, memory |

### 🔧 P3 高级示例

| # | 示例 | 描述 | 模块 |
|---|------|------|------|
| 08 | [mcp-filesystem](src/08-mcp-filesystem.ts) | MCP 协议集成 | agent, llm, mcp |
| 09 | [security-guardrails](src/09-security-guardrails.ts) | 安全护栏（敏感词、PII） | agent, llm, security |
| 10 | [evaluation-qa](src/10-evaluation-qa.ts) | Agent 评测 | evaluation, llm |
| 11 | [observability-tracing](src/11-observability-tracing.ts) | 调用追踪和 Token 统计 | agent, llm, observability |
| 12 | [deploy-api-server](src/12-deploy-api-server.ts) | 部署为 HTTP API | agent, llm, deploy |

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `OPENAI_API_KEY` | ✅ | OpenAI API 密钥 |
| `SERPER_API_KEY` | ❌ | Serper 搜索 API（示例 04） |
| `FIRECRAWL_API_KEY` | ❌ | Firecrawl API（示例 04） |

## 常见问题

### Cannot find module '@seashore/xxx'

确保已执行 `pnpm install` 和 `pnpm build`。

### API 调用失败

检查 `.env` 文件中的 API Key 是否正确。

## License

MIT

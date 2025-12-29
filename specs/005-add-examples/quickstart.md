# Quickstart: Examples 可运行示例

## 前置条件

1. Node.js >= 20.0.0
2. pnpm >= 9.x
3. OpenAI API Key

## 安装

```bash
# 克隆仓库
git clone <repo-url>
cd seashore

# 安装依赖
pnpm install

# 构建所有包
pnpm build
```

## 配置环境变量

```bash
# 进入 examples 目录
cd examples

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入 API Keys
# OPENAI_API_KEY=sk-...
```

## 运行示例

```bash
# 从仓库根目录运行
pnpm --filter @seashore/examples run 01-basic-agent

# 或进入 examples 目录后运行
cd examples
pnpm run 01-basic-agent
```

## 示例列表

### P1 核心示例（入门必看）

| 命令 | 描述 |
|------|------|
| `pnpm run 01-basic-agent` | 基础 Agent，最简单的对话 |
| `pnpm run 02-agent-with-tools` | 带工具的 Agent（天气+计算器） |
| `pnpm run 03-streaming-response` | 流式响应，打字机效果 |

### P2 进阶示例

| 命令 | 描述 |
|------|------|
| `pnpm run 04-multi-tool-agent` | 多工具协作（搜索+抓取） |
| `pnpm run 05-workflow-basic` | 两步工作流（大纲→正文） |
| `pnpm run 06-rag-knowledge-base` | RAG 知识库问答 |
| `pnpm run 07-memory-conversation` | 带记忆的多轮对话 |

### P3 高级示例

| 命令 | 描述 |
|------|------|
| `pnpm run 08-mcp-filesystem` | MCP 文件系统集成 |
| `pnpm run 09-security-guardrails` | 安全护栏演示 |
| `pnpm run 10-evaluation-qa` | Agent 评测 |
| `pnpm run 11-observability-tracing` | 调用追踪和 Token 统计 |
| `pnpm run 12-deploy-api-server` | 部署为 HTTP API |

## 常见问题

### Q: 运行报错 "Cannot find module '@seashore/xxx'"

A: 确保已执行 `pnpm install` 和 `pnpm build`

### Q: API 调用失败

A: 检查 `.env` 文件中的 `OPENAI_API_KEY` 是否正确配置

### Q: 某些示例需要额外的 API Key

A: 查看 `.env.example` 中的说明，部分示例需要 SERPER_API_KEY 等

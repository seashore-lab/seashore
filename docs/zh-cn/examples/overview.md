# 示例概述

`examples/` 包包含可运行的 TypeScript 脚本，端到端地演示 Seashore 的功能。

## 前置要求

- Node.js（参见仓库要求）
- pnpm
- 大多数示例需要一个兼容 OpenAI 的 API 密钥

## 安装和构建

在仓库根目录下：

```bash
pnpm install
pnpm build
```

## 环境变量

大多数示例通过 `dotenv/config` 加载环境变量。

常用变量：

- `OPENAI_API_KEY`（大多数示例必需）
- `OPENAI_API_BASE_URL`（可选；默认为 `https://api.openai.com/v1`）
- `SERPER_API_KEY`（示例 11 搜索功能必需）
- `FIRECRAWL_API_KEY`（示例 11 抓取功能必需）

## 运行示例

examples 包不依赖 npm 脚本；使用 `tsx` 直接运行文件。

在仓库根目录下：

```bash
pnpm --filter @seashorelab/examples exec tsx src/01-basic-agent.ts
```

或在 `examples/` 文件夹中：

```bash
pnpm exec tsx src/01-basic-agent.ts
```

## 提示

- 如果看到 `Cannot find module '@seashorelab/...'`，你可能跳过了 `pnpm build`。
- 对于基于容器的示例（12、13），你需要运行 Docker。

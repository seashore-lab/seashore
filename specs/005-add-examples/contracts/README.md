# Examples Project Contracts

Examples 项目不提供外部 API，因此无需定义 API contracts。

## 内部接口

每个示例文件是独立的可执行脚本，遵循以下约定：

### 示例文件结构

```typescript
/**
 * Example: XX - Title
 * 
 * 描述示例的功能和演示的特性
 */

import 'dotenv/config';
import { ... } from '@seashore/...';

async function main() {
  // 示例逻辑
}

main().catch(console.error);
```

### 环境变量接口

| Variable | Required | Description |
|----------|----------|-------------|
| OPENAI_API_KEY | Yes | OpenAI API 密钥 |
| SERPER_API_KEY | Optional | Serper 搜索 API 密钥（04 示例） |
| FIRECRAWL_API_KEY | Optional | Firecrawl API 密钥（04 示例） |

### 运行接口

```bash
# 通过 pnpm scripts 运行
pnpm run <example-id>

# 示例
pnpm run 01-basic-agent
pnpm run 02-agent-with-tools
```

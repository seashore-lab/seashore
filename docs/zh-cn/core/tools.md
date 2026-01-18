# 工具

工具是大语言模型与外部世界之间的桥梁。

在 Seashore 中，工具具有以下特点：

- **类型安全**：输入使用 Zod 定义
- **自描述**：为大语言模型派生 JSON 模式
- **可执行**：工具具有返回结构化数据的 `execute()` 函数

工具在 `@seashore/tool` 中定义，并被智能体（`@seashore/agent`）和工作流（`@seashore/workflow`）使用。

## 快速示例

```ts
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

export const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Evaluate a basic math expression',
  inputSchema: z.object({ expression: z.string() }),
  execute: async ({ expression }) => {
    const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '')
    const result = Function(`"use strict"; return (${sanitized})`)()
    return { expression, result: Number(result) }
  },
})
```

最佳实践请参阅[定义工具](./tools/defining.md)。

## 相关示例

- [示例 02：带有工具和流的智能体](../examples/02-agent-tools-stream.md)
- [示例 11：带有审批的工具预设](../examples/11-tool-presets.md)
- [示例 15：新预设工具](../examples/15-new-preset-tools.md)

# 工具

工具是智能体与外部世界交互的主要方式。在 Seashore 中，工具是智能体可以调用的类型安全函数，用于执行获取数据、执行计算或与 API 交互等操作。

## 概述

Seashore 中的工具由以下部分组成：

- **名称**：工具的唯一标识符
- **描述**：解释何时以及如何使用工具（大语言模型读取此内容）
- **输入模式**：定义预期参数的 Zod 模式
- **执行函数**：实际实现

工具使用 `defineTool()` 定义，从定义到执行提供完整的类型安全。

## 定义工具

### 基本工具

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a specified city',
  inputSchema: z.object({
    city: z.string().describe('City name, e.g., "Tokyo"'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ city, unit = 'celsius' }) => {
    // 调用天气 API
    const weather = await fetchWeather(city)

    return {
      city,
      temperature: weather.temp,
      condition: weather.condition,
      unit,
    }
  },
})
```

### 带上下文的工具

在工具中访问执行上下文：

```typescript
const databaseTool = defineTool({
  name: 'query_database',
  description: 'Query the database',
  inputSchema: z.object({
    query: z.string().describe('SQL query'),
  }),
  execute: async ({ query }, context) => {
    // 访问上下文
    console.log('Execution ID:', context.executionId)
    console.log('User ID:', context.userId)
    console.log('Thread ID:', context.threadId)

    // 检查中止信号
    if (context.signal?.aborted) {
      throw new Error('Execution cancelled')
    }

    // 使用自定义上下文执行查询
    const database = context.metadata?.database
    return await database.query(query)
  },
})
```

### 带超时的工具

设置执行超时以防止挂起：

```typescript
const slowApiTool = defineTool({
  name: 'fetch_external_api',
  description: 'Fetch data from external API',
  inputSchema: z.object({
    endpoint: z.string(),
  }),
  timeout: 10000, // 10 秒
  execute: async ({ endpoint }) => {
    const response = await fetch(endpoint)
    return await response.json()
  },
})
```

### 带重试的工具

失败时自动重试：

```typescript
const unreliableTool = defineTool({
  name: 'unreliable_api',
  description: 'Call an unreliable API',
  inputSchema: z.object({
    url: z.string(),
  }),
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1 秒
    backoffMultiplier: 2, // 指数退避
  },
  execute: async ({ url }) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('API failed')
    return await response.json()
  },
})
```

## 工具结果格式

工具返回 `ToolResult<T>` 对象：

```typescript
interface ToolResult<T> {
  success: boolean        // 执行是否成功
  data?: T                // 结果数据（如果成功）
  error?: string          // 错误消息（如果失败）
  durationMs: number      // 执行持续时间
  metadata?: Record<string, unknown> // 附加信息
}
```

`execute` 函数可以直接返回数据 - 它会自动包装在 `ToolResult` 中：

```typescript
// 这样：
execute: async ({ x, y }) => {
  return { sum: x + y }
}

// 内部变为这样：
{
  success: true,
  data: { sum: 5 },
  durationMs: 12,
}
```

## 在智能体中使用工具

### 单个工具

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
  tools: [weatherTool],
})

const result = await agent.run('What is the weather in Tokyo?')
// 智能体自动调用 weatherTool 并使用结果
```

### 多个工具

```typescript
const agent = createAgent({
  name: 'assistant',
  model: openaiText('gpt-4o'),
  systemPrompt: 'You are a helpful assistant.',
  tools: [weatherTool, calculatorTool, searchTool],
})

const result = await agent.run(
  'What is the weather in Tokyo and what is 15 + 27?'
)
// 智能体调用 weatherTool 和 calculatorTool
```

### 工具上下文

向工具传递自定义上下文：

```typescript
const result = await agent.run('Query users table', {
  toolContext: {
    database: myDatabaseConnection,
    userId: currentUser.id,
    permissions: currentUser.permissions,
  },
})
```

## 工具验证

工具使用 Zod 模式自动验证输入：

```typescript
const calculatorTool = defineTool({
  name: 'calculator',
  description: 'Perform calculations',
  inputSchema: z.object({
    a: z.number().int().positive(),
    b: z.number().int().positive(),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  }),
  execute: async ({ a, b, operation }) => {
    // 此处输入保证有效
    switch (operation) {
      case 'add': return { result: a + b }
      case 'subtract': return { result: a - b }
      case 'multiply': return { result: a * b }
      case 'divide': return { result: a / b }
    }
  },
})
```

如果智能体提供无效输入，验证错误将作为工具结果返回。

## 高级验证

使用 `withValidation` 进行额外的运行时验证：

```typescript
import { withValidation, ValidationError } from '@seashore/tool'

const userTool = defineTool({
  name: 'update_user',
  description: 'Update user information',
  inputSchema: z.object({
    userId: z.string(),
    email: z.string().email(),
  }),
  execute: async ({ userId, email }) => {
    // 附加验证
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format')
    }

    return await updateUser(userId, email)
  },
})

// 使用验证中间件包装
const validatedTool = withValidation(userTool, {
  sanitize: true,
  maxStringLength: 1000,
})
```

## 工具审批工作流

对于敏感操作，在执行前需要用户批准：

```typescript
import { withApproval, createMemoryApprovalHandler } from '@seashore/tool'

// 创建审批处理程序
const approvalHandler = createMemoryApprovalHandler()

// 使用审批要求包装工具
const deleteTool = withApproval(
  defineTool({
    name: 'delete_file',
    description: 'Delete a file',
    inputSchema: z.object({
      path: z.string(),
    }),
    execute: async ({ path }) => {
      await fs.unlink(path)
      return { deleted: true }
    },
  }),
  {
    reason: 'File deletion requires approval',
    riskLevel: 'high',
    handler: approvalHandler,
  }
)

// 稍后，批准或拒绝
const pendingRequests = approvalHandler.getPending()
approvalHandler.approve(pendingRequests[0].id, 'user-123')
```

## 客户端工具

定义在客户端（浏览器）执行的工具：

```typescript
import { defineClientTool } from '@seashore/tool'

const showMapTool = defineClientTool({
  name: 'show_map',
  description: 'Display a map with a location',
  inputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    zoom: z.number().optional(),
  }),
})

// 在您的前端中：
for await (const chunk of agent.stream('Show me Tokyo on a map')) {
  if (chunk.type === 'tool-call-start' && chunk.toolCall) {
    if (isClientTool(chunk.toolCall.name)) {
      // 使用提供的坐标渲染地图 UI
      renderMap(chunk.toolCall.arguments)
    }
  }
}
```

## 内置工具预设

Seashore 提供现成可用的工具：

### Serper 搜索

由 Serper API 提供支持的网页搜索：

```typescript
import { serperTool } from '@seashore/tool'

const searchTool = serperTool({
  apiKey: process.env.SERPER_API_KEY,
  country: 'us',
  locale: 'en',
  numResults: 5,
})
```

### Firecrawl 抓取

使用 Firecrawl 进行网页抓取：

```typescript
import { firecrawlTool } from '@seashore/tool'

const scrapeTool = firecrawlTool({
  apiKey: process.env.FIRECRAWL_API_KEY,
  formats: ['markdown', 'html'],
})
```

## 最佳实践

1. **清晰的描述**：编写有助于大语言模型理解何时使用工具的描述
2. **描述性参数**：在模式字段上使用 `.describe()` 提供上下文
3. **错误处理**：优雅地处理错误并返回有意义的错误消息
4. **超时**：为外部 API 调用设置适当的超时
5. **验证**：使用 Zod 模式验证所有输入
6. **幂等性**：尽可能使工具具有幂等性
7. **安全性**：验证和清理所有输入，特别是对于文件操作
8. **审批**：对破坏性或敏感操作要求审批

## 示例：完整的工具实现

```typescript
import { defineTool } from '@seashore/tool'
import { z } from 'zod'

const emailTool = defineTool({
  name: 'send_email',
  description: 'Send an email to a recipient. Use this when the user wants to send a message.',
  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),
    subject: z.string().min(1).max(200).describe('Email subject line'),
    body: z.string().min(1).max(10000).describe('Email body content'),
    cc: z.array(z.string().email()).optional().describe('CC recipients'),
  }),
  timeout: 15000,
  retry: {
    maxAttempts: 2,
    delay: 1000,
  },
  execute: async ({ to, subject, body, cc }, context) => {
    // 检查中止信号
    if (context.signal?.aborted) {
      throw new Error('Email sending cancelled')
    }

    try {
      // 使用您的电子邮件服务发送电子邮件
      const messageId = await emailService.send({
        to,
        subject,
        body,
        cc,
        userId: context.userId,
      })

      return {
        sent: true,
        messageId,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  },
})
```

## 下一步

- [定义工具](./tools/defining.md) - 详细的工具创建指南
- [工具验证](./tools/validation.md) - 高级验证技术
- [客户端工具](./tools/client-tools.md) - 构建交互式 UI 工具
- [工具审批](./tools/approval.md) - 实现审批工作流
- [工具预设](./tools/presets.md) - 使用内置工具

## 示例

- [02：带有工具的智能体](../examples/02-agent-tools-stream.md) - 基本工具使用
- [11：工具预设](../examples/11-tool-presets.md) - Serper 和 Firecrawl 工具
- [15：新预设工具](../examples/15-new-preset-tools.md) - 创建自定义预设

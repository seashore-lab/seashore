# 定义工具

Seashore 工具使用 `@seashorelab/tool` 中的 `defineTool()` 定义。

## 设计目标

- 使模型易于选择工具（良好的 `name` + `description`）。
- 在运行时验证输入（Zod 模式）。
- 返回结构化输出（对象/数组），而不是"漂亮的字符串"。

## 结构

```ts
import { defineTool } from '@seashorelab/tool'
import { z } from 'zod'

const tool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city (Celsius).',
  inputSchema: z.object({
    city: z.string().describe('City name, e.g. "Beijing"'),
  }),
  execute: async ({ city }) => {
    return { city, temperature: 20, condition: 'Clear' }
  },
})
```

## 命名规则

- 使用 `snake_case` 名称（`get_weather`、`serper_search`）。
- 保持名称稳定：大语言模型通过工具名称学习。

## 返回形状

返回 JSON 友好的对象。

不好：

```ts
return `The temperature is 20C`;
```

好：

```ts
return { temperature: 20, unit: 'C' };
```

## 测试工具

工具可以在没有智能体的情况下直接执行：

```ts
const result = await tool.execute({ city: 'Tokyo' })
if (result.success) console.log(result.data)
```

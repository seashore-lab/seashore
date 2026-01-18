# 工具验证

Seashore 工具在运行时验证其输入。

## 验证内容

- 必填字段
- 基本类型
- 枚举和字面量联合
- 嵌套对象/数组

如果输入与 Zod 模式不匹配，工具执行将返回失败的 `ToolResult`。

## 实用建议

- 在模式字段上使用 `.describe()` 以帮助大语言模型生成正确的参数。
- 对风险工具更喜欢更严格的模式。

示例：

```ts
inputSchema: z.object({
  url: z.string().url().describe('Absolute URL to fetch'),
})
```

## 智能体交互

如果工具验证失败，您通常会看到：

- 带有 `success: false` 的 `tool-result` 块
- 模型可能会在下次迭代中使用更正的参数重试

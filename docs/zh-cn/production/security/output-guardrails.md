# 输出护栏

输出护栏在模型生成内容*之后*运行。

示例 07 应用了：

- 电子邮件/电话的 PII 编辑
- 特定主题的主题阻止

## 检查输出

```ts
const outputResult = await guardrails.checkOutput(modelText)
const finalText = outputResult.transformed ? (outputResult.output ?? modelText) : modelText
```

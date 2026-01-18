# 输入护栏

输入护栏在 Agent 看到用户内容*之前*运行。

示例 07 配置了输入规则，包括：

- 自定义规则
- `promptInjectionRule({ methods: ['keyword'] })`
- `piiDetectionRule({ action: 'redact' })`

## 检查输入

```ts
const result = await guardrails.checkInput(userText)
if (!result.passed) return
const safeText = result.transformed ? (result.output ?? userText) : userText
```

常见策略：

- 失败关闭（在违规时阻止）
- 对某些规则失败采用失败开放（例如外部审核中断）

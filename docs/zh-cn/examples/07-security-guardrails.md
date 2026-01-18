# 示例 07：安全护栏

源文件：`examples/src/07-security-guardrails.ts`

## 演示内容

- 使用内置规则创建护栏（提示词注入、PII、主题阻止）
- 实现自定义安全规则
- 在仍然允许请求的同时编辑敏感信息

## 运行方法

```bash
pnpm --filter @seashorelab/examples exec tsx src/07-security-guardrails.ts
```

## 核心概念

- 安全概述：[production/security.md](../production/security.md)
- 输入护栏：[production/security/input-guardrails.md](../production/security/input-guardrails.md)
- 输出护栏：[production/security/output-guardrails.md](../production/security/output-guardrails.md)

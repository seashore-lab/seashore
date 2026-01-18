# API 参考：安全

包：`@seashorelab/security`

## 防护机制

- `createGuardrails({ inputRules, outputRules, onViolation? })`
- `guardrails.checkInput(text)`
- `guardrails.checkOutput(text)`

## 内置规则

- `promptInjectionRule(...)`
- `piiDetectionRule(...)`
- `topicBlockRule(...)`
- `toxicityRule(...)`
- `lengthLimitRule(...)`

## 自定义规则

- `createSecurityRule({ name, type, check, ... })`

参见：

- [production/security.md](../production/security.md)
- [examples/07-security-guardrails.md](../examples/07-security-guardrails.md)

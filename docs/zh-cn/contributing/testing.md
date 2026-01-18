# 测试

Seashore 在所有包中使用 Vitest。

## 运行测试

```bash
pnpm test
```

## 运行特定测试文件

```bash
pnpm test packages/agent/__tests__/integration.test.ts
```

## 注意事项

- 某些测试可能使用 testcontainers（需要 Docker）。
- 某些测试需要提供商集成的 API 密钥。

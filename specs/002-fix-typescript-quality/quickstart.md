# Quickstart: 验证 TypeScript 代码质量修复

本文档提供修复完成后的验证步骤。

## 前置条件

```bash
# 确保依赖已安装
pnpm install
```

## 验证步骤

### 1. 类型检查

```bash
pnpm typecheck
```

**预期结果**: 零错误输出

### 2. 单元测试

```bash
pnpm test
```

**预期结果**: 所有测试通过

### 3. 检查 .js 后缀导入

```bash
# PowerShell
Get-ChildItem -Path packages -Recurse -Include "*.ts","*.tsx" | `
  Select-String -Pattern "from ['\"]\..*\.js['\"]" | `
  Where-Object { $_.Path -notlike "*node_modules*" -and $_.Path -notlike "*rollup.config*" }
```

**预期结果**: 无输出（即无 .js 后缀导入）

### 4. 检查未使用导入

```bash
pnpm lint
```

**预期结果**: 无 `@typescript-eslint/no-unused-vars` 相关警告

## 验收标准

- [ ] `pnpm typecheck` 零错误
- [ ] `pnpm test` 所有测试通过
- [ ] 无 `.js` 后缀的本地 TypeScript 导入
- [ ] 无未使用的导入声明
- [ ] 代码中使用 `any` 的地方有注释说明原因

## 常见问题

### Q: 某些类型无法修复怎么办？

如果遇到第三方库类型定义不完整的情况，可以：

1. 在必要处添加类型断言并添加注释说明原因
2. 创建 `.d.ts` 声明文件补充类型
3. 使用 `unknown` 并进行类型收窄

### Q: 测试失败但代码正确怎么办？

如果测试预期与实际业务逻辑有偏差：

1. 以代码实现为准调整测试预期
2. 边缘用例可标记为 `it.skip` 或 `it.todo`

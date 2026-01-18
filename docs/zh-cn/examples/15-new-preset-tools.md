# 示例 15：新的预设工具

源文件：`examples/src/15-new-preset-tools.ts`

## 演示内容

- 展示 `@seashore/tool/presets` 中的预设工具
- 离线工具（计算器系列）
- 网络工具（DuckDuckGo、Wikipedia、GitHub、金融、arXiv、文章提取）
- 用于受控命令执行的受限 shell 工具
- （可选）使用多个预设工具的 agent

## 运行方法

```bash
pnpm --filter @seashore/examples exec tsx src/15-new-preset-tools.ts
```

## 注意事项

- 许多子示例依赖于网络访问。
- 某些提供商可能会进行速率限制（没有 token 的 GitHub）。

## 核心概念

- 工具预设：[core/tools/presets.md](../core/tools/presets.md)
- 安全策略：[production/security/policies.md](../production/security/policies.md)

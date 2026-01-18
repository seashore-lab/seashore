# 文档

此仓库使用 mdBook 进行文档管理。

## 结构

- 书籍源码：`docs/`
- 目录：`docs/SUMMARY.md`
- mdBook 配置：`book.toml`（源码在 `docs`）

## 编写文档

- 保持页面以示例为驱动。
- 优先链接到 `examples/src/*.ts` 以提供可运行的参考。
- 如果包 README 为空或过时，优先使用 `specs/` 下的源代码 + API 契约。

## 构建书籍

如果已安装 mdBook：

```bash
mdbook build
```

或在本地提供：

```bash
mdbook serve
```

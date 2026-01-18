# Seashore Monorepo 发布指南

## 准备工作

### 1. NPM 账号配置

确保你已经：
- 在 [npmjs.com](https://www.npmjs.com) 注册账号
- 创建 NPM 组织 `seashore` 或修改所有包名为你的组织名
- 生成 NPM Access Token（需要 Automation 类型）

### 2. 配置 GitHub Secrets

在 GitHub 仓库设置中添加：
- `NPM_TOKEN`: 你的 NPM Access Token

## 发布流程

### 手动发布（本地）

#### 1. 创建 Changeset

```bash
# 记录本次要发布的变更
pnpm changeset
```

这会引导你：
- 选择要发布的包
- 选择版本升级类型（patch/minor/major）
- 输入变更说明

对于首次发布全部包，你可以运行 15 次 `pnpm changeset`，每次选择一个包，或者手动创建 changeset 文件。

#### 2. 更新版本号（可选）

```bash
# 应用所有 changesets，更新 package.json 和 CHANGELOG
pnpm version
```

**注意**：由于你要保持 0.1.0，可以跳过此步骤。

#### 3. 构建所有包

```bash
# 确保所有包都已构建
pnpm build
```

#### 4. 运行测试

```bash
# 确保所有测试通过
pnpm test
```

#### 5. 发布到 NPM

```bash
# 方式1: 使用 changesets 发布（推荐）
# 注意：这会自动升级版本，如果想保持 0.1.0，使用方式2
pnpm release

# 方式2: 直接发布所有包，不更改版本
pnpm -r publish --access public --no-git-checks
```

#### 6. 推送 Git Tags

```bash
git push --follow-tags
```

### 自动发布（GitHub Actions）

我们已经配置了 GitHub Actions 自动发布流程：

#### 使用 Changesets（推荐）

1. 创建 changesets：
   ```bash
   pnpm changeset
   git add .changeset
   git commit -m "chore: add changeset for v0.1.0"
   git push
   ```

2. GitHub Actions 会自动：
   - 创建一个 "Version Packages" PR
   - 当 PR 合并到 main 时，自动发布所有有变更的包

#### 手动触发

在 GitHub 仓库的 Actions 页面，手动运行 "Publish to npm" workflow。

## 首次发布特殊说明

由于你要保持 0.1.0 版本发布所有包，建议：

### 选项 A：使用 pnpm publish（最简单）

```bash
# 1. 确保已构建
pnpm build

# 2. 确保测试通过
pnpm test

# 3. 设置 NPM_TOKEN 环境变量
# Windows PowerShell:
$env:NPM_TOKEN = "your-npm-token-here"

# 4. 发布所有包
pnpm -r publish --access public --no-git-checks

# 5. 提交和推送
git add .
git commit -m "chore: publish v0.1.0"
git push
```

### 选项 B：使用 Changesets

首先创建一个初始 changeset：

```bash
# 在 .changeset 目录创建一个文件，例如 initial-release.md
```

内容如下：

```markdown
---
"@seashorelab/agent": patch
"@seashorelab/llm": patch
"@seashorelab/tool": patch
"@seashorelab/workflow": patch
"@seashorelab/storage": patch
"@seashorelab/vectordb": patch
"@seashorelab/rag": patch
"@seashorelab/memory": patch
"@seashorelab/mcp": patch
"@seashorelab/security": patch
"@seashorelab/evaluation": patch
"@seashorelab/deploy": patch
"@seashorelab/observability": patch
"@seashorelab/genui": patch
"@seashorelab/contextengineering": patch
---

Initial release of Seashore Agent Framework v0.1.0
```

然后：

```bash
# 1. 提交 changeset
git add .changeset/initial-release.md
git commit -m "chore: add initial release changeset"
git push

# 2. GitHub Actions 会创建 PR，合并 PR 后自动发布
```

## 发布顺序

包会按照依赖关系自动以正确的顺序发布：

1. **基础层**（无依赖）
   - @seashorelab/llm
   - @seashorelab/tool
   - @seashorelab/storage
   - @seashorelab/contextengineering

2. **中间层**
   - @seashorelab/workflow
   - @seashorelab/vectordb
   - @seashorelab/mcp

3. **高级层**
   - @seashorelab/agent
   - @seashorelab/rag
   - @seashorelab/memory
   - @seashorelab/observability

4. **应用层**
   - @seashorelab/genui
   - @seashorelab/deploy
   - @seashorelab/evaluation
   - @seashorelab/security

## 验证发布

发布后，在以下位置验证：

1. NPM：https://www.npmjs.com/package/@seashorelab/agent
2. 测试安装：
   ```bash
   npm create vite@latest test-seashore
   cd test-seashore
   npm install @seashorelab/agent @seashorelab/llm
   ```

## 常见问题

### Q: 发布失败，提示 "You must be logged in to publish packages"

A: 确保已设置 `NPM_TOKEN` 环境变量或运行 `npm login`

### Q: 提示包名已存在

A: 需要修改 package.json 中的包名或在 npmjs.com 上创建组织

### Q: 如何只发布单个包？

A: 
```bash
cd packages/llm
pnpm publish --access public
```

### Q: 如何撤销已发布的版本？

A:
```bash
npm unpublish @seashorelab/agent@0.1.0
```

**注意**：只能在发布后 72 小时内撤销。

## 最佳实践

1. **发布前检查清单**
   - [ ] 所有测试通过
   - [ ] 所有包已构建（dist 目录存在）
   - [ ] CHANGELOG 已更新
   - [ ] README 文档完整
   - [ ] 版本号正确

2. **版本管理**
   - 使用语义化版本：patch (0.1.x), minor (0.x.0), major (x.0.0)
   - 保持所有包版本同步（推荐）

3. **安全**
   - 不要将 NPM_TOKEN 提交到代码库
   - 使用 Automation 类型的 token
   - 定期轮换 token

## 后续版本发布

对于后续版本更新：

```bash
# 1. 开发完成后，创建 changeset
pnpm changeset

# 2. 提交代码
git add .
git commit -m "feat: add new feature"
git push

# 3. GitHub Actions 会创建 Version PR
# 4. Review 并合并 PR
# 5. 自动发布到 NPM
```

# Feature Specification: 修复 TypeScript 代码质量问题

**Feature Branch**: `002-fix-typescript-quality`  
**Created**: 2025-12-27  
**Status**: Draft  
**Input**: User description: "修复项目中的类型问题、移除无用导入、移除 .js 后缀并确保单元测试通过"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 类型安全的代码库 (Priority: P1)

开发者在使用 Seashore 框架时，期望所有包的代码都能通过 TypeScript 严格类型检查（`tsc --noEmit`），不会出现类型错误，从而确保代码质量和开发体验。

**Why this priority**: 类型安全是 TypeScript 项目的核心价值，类型错误会导致编译失败、IDE 无法提供正确的智能提示，严重影响开发效率和代码可靠性。

**Independent Test**: 运行 `pnpm typecheck` 命令，所有包应该零错误通过。

**Acceptance Scenarios**:

1. **Given** 开发者克隆了项目代码, **When** 运行 `pnpm typecheck`, **Then** 所有 TypeScript 文件通过类型检查，无错误输出
2. **Given** 开发者在 IDE 中打开任意包的源代码, **When** 查看类型提示, **Then** 所有变量、函数参数、返回值都有正确的类型推断
3. **Given** 代码中存在类型问题的根因, **When** 修复问题时, **Then** 优先修复根本原因而非使用 `any`、类型断言或非空断言

---

### User Story 2 - 干净的导入声明 (Priority: P1)

开发者期望代码库中的导入声明是干净的：没有未使用的导入，导入本地 TypeScript 文件时不使用 `.js` 后缀。

**Why this priority**: 未使用的导入增加代码噪音，降低可读性；`.js` 后缀在某些构建配置下可能导致问题，不符合项目的模块解析策略。

**Independent Test**: 使用 ESLint 检查未使用导入，使用 grep 检查 `.js` 后缀导入，两者均应为零。

**Acceptance Scenarios**:

1. **Given** 开发者打开任意源文件, **When** 查看导入声明, **Then** 所有导入都被实际使用
2. **Given** 一个 TypeScript 文件导入另一个本地 TypeScript 文件, **When** 查看导入路径, **Then** 路径不包含 `.js` 后缀（例如 `import { foo } from './bar'` 而非 `import { foo } from './bar.js'`）
3. **Given** 开发者运行 lint 检查, **When** 检查完成, **Then** 不报告未使用导入的警告

---

### User Story 3 - 通过的单元测试 (Priority: P1)

开发者期望所有单元测试都能正确通过，测试用例应该准确反映业务逻辑和预期行为。

**Why this priority**: 单元测试是代码质量的保障，测试失败意味着代码可能存在 bug 或测试本身需要修正。

**Independent Test**: 运行 `pnpm test` 命令，所有测试用例应该通过。

**Acceptance Scenarios**:

1. **Given** 开发者克隆了项目代码, **When** 运行 `pnpm test`, **Then** 所有单元测试通过，无失败用例
2. **Given** 测试用例存在与类型修复相关的问题, **When** 修复测试, **Then** 优先保证类型正确和主流程逻辑正确
3. **Given** 存在边缘用例测试, **When** 边缘用例与核心功能冲突, **Then** 可以标记为 skip 或 todo，待后续补充

---

### Edge Cases

- 当某些类型问题无法通过修复根因解决（如第三方库类型定义不完整）时，可以在必要处添加类型断言并添加注释说明原因
- 当测试用例的预期与实际业务逻辑存在偏差时，以代码实现为准调整测试预期
- 当 tsconfig 配置过于严格导致大量误报时，可以适当放宽配置（如允许 implicit any）

## Requirements *(mandatory)*

### Functional Requirements

**类型修复**

- **FR-001**: 系统 MUST 解决所有 TypeScript 编译错误，使 `tsc --noEmit` 通过
- **FR-002**: 系统 MUST 优先修复类型问题的根本原因，而非滥用 `any`、类型断言（`as`）或非空断言（`!`）
- **FR-003**: 系统 MAY 在必要时调整 tsconfig.json 配置，使其既保持类型安全又不过于严格

**导入清理**

- **FR-004**: 系统 MUST 移除所有未使用的导入声明
- **FR-005**: 系统 MUST 将所有本地 TypeScript 文件导入中的 `.js` 后缀移除
- **FR-006**: 系统 SHOULD 保持导入声明的组织和排序一致性

**单元测试**

- **FR-007**: 系统 MUST 确保所有单元测试通过
- **FR-008**: 系统 MUST 保证测试用例的类型正确
- **FR-009**: 系统 SHOULD 保证测试用例的业务逻辑正确
- **FR-010**: 系统 MAY 跳过或标记边缘用例测试待后续补充

### Key Entities

- **Package**: 各个 npm 包（agent、llm、tool、workflow 等），每个包有独立的源代码和测试
- **TypeScript Configuration**: tsconfig.json 及其继承关系，控制类型检查的严格程度
- **Test Suite**: 使用 Vitest 编写的单元测试集合

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 运行 `pnpm typecheck` 命令返回零错误
- **SC-002**: 代码库中不存在未使用的导入声明
- **SC-003**: 代码库中不存在带 `.js` 后缀的本地 TypeScript 文件导入
- **SC-004**: 运行 `pnpm test` 命令所有测试通过
- **SC-005**: 代码中使用 `any` 类型的地方有明确的注释说明原因
- **SC-006**: 代码中使用类型断言和非空断言的地方是合理且必要的

## Assumptions

- 当前项目是由 Claude 基于 speckit 流程生成的初版，可能存在一些生成质量问题
- 项目使用 pnpm 作为包管理器，使用 Vitest 作为测试框架
- 项目使用 ESM 模块系统，moduleResolution 设置为 "bundler"
- 开发者熟悉 TypeScript 和项目的整体架构
- 对于第三方库的类型问题，可以使用类型声明补充或必要的断言

# Contributing

Thank you for your interest in contributing to Seashore! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- PostgreSQL (for integration tests)

### Installation

```bash
# Clone the repository
git clone https://github.com/user/seashore
cd seashore

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
seashore/
├── packages/          # Source packages
│   ├── agent/         # Core agent implementation
│   ├── llm/           # LLM adapters
│   ├── tool/          # Tool definitions
│   └── ...
├── examples/          # Example applications
├── specs/             # Feature specifications
└── docs/              # Documentation
```

## Development Workflow

### Making Changes

1. Create a feature branch:

```bash
git checkout -b feature/my-feature
```

2. Make your changes in the appropriate package

3. Build and test:

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

4. Commit with clear messages:

```bash
git commit -m "feat: add new tool type"
```

### Commit Message Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm test packages/agent

# Watch mode
pnpm test:watch

# Coverage
pnpm test --coverage
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { createAgent } from '@seashore/agent'

describe('createAgent', () => {
  it('should create an agent with a name', () => {
    const agent = createAgent({
      name: 'test-agent',
      model: mockModel,
    })
    expect(agent.name).toBe('test-agent')
  })
})
```

### Test Organization

- Unit tests: `packages/*/src/**/*.test.ts`
- Integration tests: `packages/*/__tests__/`
- Examples as tests: `examples/src/*.ts`

## Code Style

### TypeScript

- Use strict mode
- Prefer `const` over `let`
- Use `type` for types, `interface` for object shapes
- Avoid `any` - use `unknown` or generics

### Formatting

```bash
# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Linting

```bash
# Run linter
pnpm lint

# Fix issues
pnpm lint:fix
```

## Documentation

### API Documentation

Update API contracts in `specs/001-agent-framework/contracts/` when changing public APIs.

### Examples

Add examples in `examples/src/` for new features.

### This Documentation

Update `docs/` when adding or changing features.

## Pull Requests

### Before Submitting

1. Update tests for new functionality
2. Ensure all tests pass
3. Update documentation
4. Run `pnpm typecheck` and `pnpm lint`

### PR Checklist

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] PR description explains the change

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How changes were tested

## Related Issues
Closes #123
```

## Adding New Packages

### 1. Create the Package

```bash
cd packages
mkdir my-package
cd my-package
pnpm init
```

### 2. Configure package.json

```json
{
  "name": "@seashore/my-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

### 3. Add Build Config

Create `rollup.config.js` in the package root.

### 4. Update Monorepo

Add to `pnpm-workspace.yaml` if needed.

### 5. Add Tests

Create `__tests__/` directory with test files.

### 6. Add Documentation

Create `docs/src/packages/my-package.md`

## Release Process

Releases are managed by maintainers:

1. Update version numbers
2. Generate changelog
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn

### Getting Help

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Documentation: Reference docs and tutorials

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

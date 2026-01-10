# Installation

This guide will help you install Seashore and get it ready for building AI agents.

## Prerequisites

Before installing Seashore, ensure you have the following:

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0

### Check Your Versions

```bash
node --version  # Should be v20 or higher
pnpm --version  # Should be v8 or higher
```

If you don't have pnpm installed, you can install it globally:

```bash
npm install -g pnpm
```

## Installing Seashore

Seashore is distributed as multiple packages. You can install only the packages you need for your project.

### Core Installation (Recommended)

For most projects, you'll want the core packages:

```bash
pnpm add @seashore/agent @seashore/llm @seashore/tool
```

This installs:
- `@seashore/agent` - Core agent creation and execution
- `@seashore/llm` - LLM adapters (OpenAI, Anthropic, Gemini)
- `@seashore/tool` - Tool definition system

### Full Installation

Install all Seashore packages:

```bash
pnpm add @seashore/agent \
  @seashore/llm \
  @seashore/tool \
  @seashore/workflow \
  @seashore/rag \
  @seashore/memory \
  @seashore/storage \
  @seashore/vectordb \
  @seashore/mcp \
  @seashore/genui \
  @seashore/observability \
  @seashore/evaluation \
  @seashore/security \
  @seashore/deploy
```

### Individual Packages

You can also install packages individually as needed:

```bash
# For RAG capabilities
pnpm add @seashore/rag @seashore/vectordb @seashore/storage

# For workflow orchestration
pnpm add @seashore/workflow

# For deployment
pnpm add @seashore/deploy

# For frontend UI components
pnpm add @seashore/genui
```

## Setting Up API Keys

Seashore requires API keys for the LLM providers you want to use.

### Environment Variables

Create a `.env` file in your project root:

```bash
# OpenAI (for GPT models)
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Google AI (for Gemini models)
GOOGLE_API_KEY=your-google-api-key-here
```

### Loading Environment Variables

We recommend using a package like `dotenv` to load environment variables:

```bash
pnpm add -D dotenv
```

Then load it in your application:

```typescript
import 'dotenv/config'
// Now process.env.OPENAI_API_KEY is available
```

### Optional: Additional API Keys

Some features require additional API keys:

```bash
# Serper API (for search tool)
SERPER_API_KEY=your-serper-key-here

# Firecrawl API (for web scraping tool)
FIRECRAWL_API_KEY=your-firecrawl-key-here

# Database (for storage, vectordb, memory)
DATABASE_URL=postgresql://user:password@localhost:5432/seashore
```

## Verifying Installation

Create a test file to verify your installation:

```typescript
// test-seashore.ts
import { createAgent } from '@seashore/agent'
import { openaiText } from '@seashore/llm'

const agent = createAgent({
  name: 'test-agent',
  model: openaiText('gpt-4o', { apiKey: process.env.OPENAI_API_KEY! }),
  systemPrompt: 'You are a helpful assistant.',
})

console.log('Seashore installed successfully!')
console.log('Agent name:', agent.name)
```

Run it:

```bash
npx tsx test-seashore.ts
```

If everything is set up correctly, you should see:

```
Seashore installed successfully!
Agent name: test-agent
```

## TypeScript Configuration

Seashore works best with strict TypeScript settings. Ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Next Steps

With Seashore installed, you're ready to build your first agent:

- [Quickstart](quickstart.md) - Create your first agent in 5 minutes
- [Project Structure](project-structure.md) - Understand the Seashore architecture

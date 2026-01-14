/**
 * Example 11 - Tool Presets with Approval
 *
 * This example demonstrates how to use preset tools (Serper search and Firecrawl scraping)
 * combined with approval workflow for sensitive operations.
 */

import 'dotenv/config';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import {
  serperTool,
  firecrawlTool,
  withApproval,
  createMemoryApprovalHandler,
} from '@seashore/tool';

async function main() {
  console.log('[Example 11: Tool Presets with Approval]\n');

  // Create approval handler
  const approvalHandler = createMemoryApprovalHandler();

  // Configure Serper search tool (no approval needed for read-only operations)
  const searchTool = serperTool({
    apiKey: process.env.SERPER_API_KEY || '',
    country: 'us',
    locale: 'en',
    numResults: 5,
  });

  // Configure Firecrawl scraping tool with approval requirement
  // Web scraping can consume resources and should be approved
  const baseScrapeToolInstance = firecrawlTool({
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    formats: ['markdown'],
  });

  const scrapeTool = withApproval(baseScrapeToolInstance, {
    reason: 'Web scraping requires approval to prevent resource abuse',
    riskLevel: 'medium',
    handler: approvalHandler,
    timeout: 30000,
  });

  // Auto-approve scraping requests after a delay (simulating user review)
  const autoApproveTimer = setInterval(() => {
    const pending = Array.from(approvalHandler.pendingRequests.values());
    for (const request of pending) {
      if (request.toolName === 'firecrawl_scrape') {
        console.log(`\n   🔍 Approval Request:`);
        console.log(`      Tool: ${request.toolName}`);
        console.log(`      Risk: ${request.riskLevel}`);
        console.log(`      URL: ${JSON.stringify(request.input)}`);
        console.log(`   ✅ Auto-approved by system\n`);
        approvalHandler.approve(request.id, 'auto-system');
      }
    }
  }, 3000);

  console.log('--- Research Assistant with Search and Scraping ---\n');

  // Create an agent with both tools
  const agent = createAgent({
    name: 'research-assistant',
    model: openaiText('gpt-5.1', {
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
    }),
    systemPrompt:
      'You are a research assistant that can search the web and scrape content. ' +
      'First search for information, then if needed, scrape relevant pages for detailed content. ' +
      'Always explain what you are doing.',
    tools: [searchTool, scrapeTool],
  });

  const query =
    'Find recent articles about TypeScript 5.0 and summarize the key features from the top result';
  console.log(`📝 User: ${query}\n`);
  console.log('🤖 Agent:');

  try {
    for await (const chunk of agent.stream(query)) {
      if (chunk.type === 'content' && chunk.delta) {
        process.stdout.write(chunk.delta);
      } else if (chunk.type === 'tool-call-end' && chunk.toolCall) {
        console.log(`\n\n[🔧 Calling tool: ${chunk.toolCall.name}]`);
        if (chunk.toolCall.name === 'serper_search') {
          console.log(`   Query: ${JSON.stringify(chunk.toolCall.arguments)}`);
        } else if (chunk.toolCall.name === 'firecrawl_scrape') {
          console.log(`   URL: ${JSON.stringify(chunk.toolCall.arguments)}`);
        }
      } else if (chunk.type === 'tool-result' && chunk.toolCall && chunk.toolResult) {
        if (chunk.toolCall.name === 'serper_search') {
          const result = chunk.toolResult.data as { organic?: Array<{ title: string }> };
          if (result.organic) {
            console.log(`   ✓ Found ${result.organic.length} search results`);
          }
        } else if (chunk.toolCall.name === 'firecrawl_scrape') {
          console.log(`   ✓ Page scraped successfully`);
        }
        console.log();
      }
    }
  } finally {
    clearInterval(autoApproveTimer);
  }

  console.log('\n\n--- Summary ---\n');
  console.log('✨ This example demonstrated:');
  console.log('   1. Using Serper for web search (no approval needed)');
  console.log('   2. Using Firecrawl for web scraping (with approval)');
  console.log('   3. Combining both tools in a research workflow');
  console.log('   4. Automatic approval workflow for demonstration\n');
}

main().catch(console.error);

// [Example 11: Tool Presets with Approval]

// --- Research Assistant with Search and Scraping ---

// 📝 User: Find recent articles about TypeScript 5.0 and summarize the key features from the top result

// 🤖 Agent:

// [🔧 Calling tool: serper_search]
//    Query: "{\"query\":\"TypeScript 5.0 new features\",\"type\":\"search\"}"
//    ✓ Found 5 search results

// I first searched the web for “TypeScript 5.0 new features” using the Serper search tool. Now I’ll open the top result (the official announcement blog) and extract its contents so I can summarize the key features directly from the source.

// [🔧 Calling tool: firecrawl_scrape]
//    URL: "{\"includeLinks\":false,\"url\":\"https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/\"}"

//    🔍 Approval Request:
//       Tool: firecrawl_scrape
//       Risk: medium
//       URL: {"includeLinks":false,"url":"https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/"}
//    ✅ Auto-approved by system

//    ✓ Page scraped successfully

// Here’s what I did: I searched the web for “TypeScript 5.0 new features”, then scraped the top result (the official “Announcing TypeScript 5.0” post on the Microsoft TypeScript blog) and summarized its main feature highlights.

// From that top result, the key TypeScript 5.0 features are:

// 1. **Standards-based decorators**
//    - Implements the new ECMAScript decorators standard (no longer just the old `--experimentalDecorators` model).
//    - Works on classes, methods, fields, accessors, etc.
//    - Decorators receive a *context object* (e.g. `ClassMethodDecoratorContext`) with metadata like name, static/private flags, and an `addInitializer` hook.
//    - You can stack decorators and control order; decorators can also be factories (functions that return decorators).

// 2. **`const` type parameters**
//    - New `const` modifier for generics: `function foo<const T extends ...>(arg: T) { ... }`
//    - Enables “as const”-style, more-specific inference by default for literals passed inline (arrays, objects, primitives), without requiring `as const` everywhere.
//    - Especially useful for library APIs that want precise literal types from object/array inputs.

// 3. **Multiple `extends` in `tsconfig.json`**
//    - `extends` can now be an array, e.g.:
//      ```json
//      {
//        "extends": ["@tsconfig/strictest/tsconfig.json", "./tsconfig.base.json"]
//      }
//      ```
//    - Later entries win on conflicts. Makes it easier to compose shared base configs (e.g., internal base + community strict config).

// 4. **All `enum`s are union enums**
//    - Every `enum` is now treated as a union of its members, even when members are computed.
//    - Improves narrowing and type safety, and fixes some old inconsistencies.
//    - Includes stricter checks: you can no longer assign out‑of‑range values to an enum without an error.

// 5. **`--moduleResolution bundler`**
//    - New module resolution mode aimed at modern bundlers (Vite, esbuild, Webpack, Parcel, etc.).
//    - Models the hybrid behavior bundlers typically use (e.g., extensionless imports allowed, but still respecting `exports`/`imports` conditions).
//    - Recommended for app code using bundlers; library authors should generally stick with `node16`/`nodenext`.

// 6. **Resolution customization flags**
//    - Fine-grained control over module resolution behavior:
//      - `allowImportingTsExtensions` – allow imports with `.ts`/`.tsx`/`.mts` in *type-check only* builds.
//      - `resolvePackageJsonExports` – respect `package.json "exports"` (on by default in `node16`, `nodenext`, `bundler`).
//      - `resolvePackageJsonImports` – respect `package.json "imports"` (same defaults).
//      - `allowArbitraryExtensions` – permit imports of non-JS/TS files if you provide matching `.d.<ext>.ts` declarations.
//      - `customConditions` – add custom conditions for resolving `exports`/`imports` (e.g., `"my-condition"`).

// 7. **`--verbatimModuleSyntax`**
//    - New, simpler module-emit model:
//      - Imports/exports *without* `type` are preserved as-is in JS.
//      - Anything marked with `type` (`import type`, `export type`) is dropped entirely from JS output.
//    - Eliminates complex “import elision” rules and replaces two older flags:
//      - Deprecates `--importsNotUsedAsValues` and `--preserveValueImports`.
//    - Forces clearer distinction between type-only vs value imports/exports and clarifies interop with ESM/CJS.

// 8. **Support for `export type *`**
//    - You can now re-export only types with star exports:
//      ```ts
//      export type * as ns from "./module";
//      ```
//    - Useful for type-only aggregation without accidentally exporting runtime bindings.

// 9. **New JSDoc capabilities**
//    - `@satisfies` in JSDoc:
//      - Mirrors the TS `satisfies` operator for JS files.
//      - Validates that an expression conforms to a type, but keeps its more-specific inferred type.
//    - `@overload` in JSDoc:
//      - Lets you declare multiple overload signatures on a JS function via multiple JSDoc blocks tagged with `@overload`.

// 10. **Build / tooling quality-of-life**
//     - `tsc --build` can now accept emit-related flags like `--declaration`, `--emitDeclarationOnly`, `--sourceMap`, etc., at the command line.
//     - Case-insensitive import sorting improvements in editors (better alignment with tools like ESLint).
//     - Exhaustive `switch` completion for literal unions – the editor can scaffold missing `case` branches.

// 11. **Performance and size improvements**
//     - Compiler and common builds 10–20% faster in their benchmarks.
//     - `typescript` npm package reduced from ~63.8 MB to ~37.4 MB (about 59% of previous size).
//     - Achieved via migration from namespaces to ES modules, internal data-structure optimizations, caching, etc.

// 12. **Breaking changes / deprecations (high level)**
//     - Target baseline is now ECMAScript 2018; minimum Node.js version 12.20.
//     - Several options deprecated (e.g. `--target ES3`, `--importsNotUsedAsValues`, `--preserveValueImports`, `--out`, etc.) and some defaults changed (`--forceConsistentCasingInFileNames` now true, `--newLine` now `LF`).

// If you tell me your use case (library vs app, Node vs browser, decorators usage, etc.), I can highlight which of these are most relevant and show small, focused code examples tailored to your setup.

// --- Summary ---

// ✨ This example demonstrated:
//    1. Using Serper for web search (no approval needed)
//    2. Using Firecrawl for web scraping (with approval)
//    3. Combining both tools in a research workflow
//    4. Automatic approval workflow for demonstration

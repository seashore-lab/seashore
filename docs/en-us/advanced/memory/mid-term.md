# Mid-Term Memory (Summaries and Consolidation)

Mid-term memory is where you reduce token growth by consolidating many raw messages into fewer, higher-signal artifacts.

In Seashore, this is typically implemented via:

- consolidation utilities (deduplication, grouping, summarization)
- summary/fact schemas in the memory module

## Typical workflow

1. Collect recent short-term entries for a thread.
2. Periodically generate a summary and store it.
3. Use the summary as the “history” context for future prompts.

## Utilities you can use

The memory package exports helpers such as:

- `deduplicateMemories`
- `groupByThread`
- `groupByTimeWindow`
- `extractKeyPoints`
- `generateBasicSummary`
- `createConsolidationPipeline`

Use these as building blocks; production summarization usually involves an LLM.

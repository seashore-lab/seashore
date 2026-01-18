# Tool Validation

Seashore tools validate their inputs at runtime.

## What Gets Validated

- required fields
- primitive types
- enums and literal unions
- nested objects/arrays

If the input does not match the Zod schema, the tool execution returns a failed `ToolResult`.

## Practical Advice

- Use `.describe()` on schema fields to help the LLM produce correct arguments.
- Prefer stricter schemas for risky tools.

Example:

```ts
inputSchema: z.object({
  url: z.string().url().describe('Absolute URL to fetch'),
})
```

## Agent Interaction

If a tool validation fails, you will typically see:

- a `tool-result` chunk with `success: false`
- the model may try again with corrected arguments in the next iteration

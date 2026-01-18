/**
 * @seashorelab/tool - Zod to JSON Schema Converter
 *
 * Converts Zod schemas to JSON Schema for LLM function calling
 * Uses Zod 4's built-in toJSONSchema function
 */

import { z, type ZodSchema } from 'zod';
import type { JsonSchema } from './types';

/**
 * Convert a Zod schema to JSON Schema
 *
 * Uses Zod 4's built-in toJSONSchema function for reliable conversion.
 * Supports all Zod types including primitives, objects, arrays, unions, etc.
 *
 * @param schema - A Zod schema
 * @returns JSON Schema object
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { zodToJsonSchema } from './zod-to-json-schema';
 *
 * const schema = z.object({
 *   name: z.string().describe('User name'),
 *   age: z.number().optional(),
 * });
 *
 * const jsonSchema = zodToJsonSchema(schema);
 * // => {
 * //   type: 'object',
 * //   properties: {
 * //     name: { type: 'string', description: 'User name' },
 * //     age: { type: 'number' }
 * //   },
 * //   required: ['name']
 * // }
 * ```
 */
export function zodToJsonSchema(schema: ZodSchema): JsonSchema {
  // Use Zod 4's built-in toJSONSchema function
  const jsonSchema = z.toJSONSchema(schema) as JsonSchema;

  // For object types, add additionalProperties: false for stricter validation
  // unless the schema is a passthrough object (allows extra properties)
  if (jsonSchema.type === 'object' && jsonSchema.additionalProperties === undefined) {
    return {
      ...jsonSchema,
      additionalProperties: false,
    };
  }

  return jsonSchema;
}

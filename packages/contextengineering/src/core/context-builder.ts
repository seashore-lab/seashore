/**
 * @seashore/contextengineering - Context Builder
 *
 * Fluent API for building structured prompts
 */

import type {
  ContextConfig,
  ContextBuilder as IContextBuilder,
  ContextBlock,
  IdentityConfig,
  EnvironmentOptions,
  Example,
  OutputFormatConfig,
} from '../types';
import { createEnvironmentProvider } from '../providers/environment';
import { renderTemplate } from './template';

/**
 * Block priority constants
 */
const PRIORITY = {
  IDENTITY: 10,
  ENVIRONMENT: 20,
  INSTRUCTIONS: 30,
  OUTPUT_FORMAT: 40,
  EXAMPLES: 50,
  CONTEXT: 60,
  CUSTOM: 100,
};

/**
 * Create an identity block
 */
function createIdentityBlock(config: IdentityConfig): ContextBlock {
  return {
    type: 'identity',
    priority: PRIORITY.IDENTITY,
    isStatic: true,

    async render(): Promise<string> {
      const lines: string[] = [];

      lines.push('## Identity');
      lines.push('');

      if (config.name) {
        lines.push(`You are **${config.name}**.`);
      }

      if (config.role) {
        lines.push(config.role);
      }

      if (config.description) {
        lines.push('');
        lines.push(config.description);
      }

      if (config.personality && config.personality.length > 0) {
        lines.push('');
        lines.push('**Personality:**');
        config.personality.forEach((trait) => {
          lines.push(`- ${trait}`);
        });
      }

      if (config.capabilities && config.capabilities.length > 0) {
        lines.push('');
        lines.push('**Capabilities:**');
        config.capabilities.forEach((cap) => {
          lines.push(`- ${cap}`);
        });
      }

      if (config.constraints && config.constraints.length > 0) {
        lines.push('');
        lines.push('**Constraints:**');
        config.constraints.forEach((con) => {
          lines.push(`- ${con}`);
        });
      }

      return lines.join('\n');
    },
  };
}

/**
 * Create an environment block
 */
function createEnvironmentBlock(options: EnvironmentOptions | boolean): ContextBlock {
  const envOptions: EnvironmentOptions =
    options === true ? { currentDateTime: true, timezone: true } : options === false ? {} : options;

  return {
    type: 'environment',
    priority: PRIORITY.ENVIRONMENT,
    isStatic: false, // Environment is always dynamic

    async render(): Promise<string> {
      const provider = createEnvironmentProvider(envOptions);
      return provider.format();
    },
  };
}

/**
 * Create an instructions block
 */
function createInstructionsBlock(instructions: readonly string[]): ContextBlock {
  return {
    type: 'instructions',
    priority: PRIORITY.INSTRUCTIONS,
    isStatic: true,

    async render(): Promise<string> {
      if (instructions.length === 0) {
        return '';
      }

      const lines: string[] = [];
      lines.push('## Instructions');
      lines.push('');
      instructions.forEach((instruction) => {
        lines.push(`- ${instruction}`);
      });

      return lines.join('\n');
    },
  };
}

/**
 * Create an output format block
 */
function createOutputFormatBlock(config: OutputFormatConfig): ContextBlock {
  return {
    type: 'output-format',
    priority: PRIORITY.OUTPUT_FORMAT,
    isStatic: true,

    async render(): Promise<string> {
      const lines: string[] = [];
      lines.push('## Output Format');
      lines.push('');

      if (config.type) {
        lines.push(`- Format: ${config.type}`);
      }

      if (config.constraints && config.constraints.length > 0) {
        config.constraints.forEach((constraint) => {
          lines.push(`- ${constraint}`);
        });
      }

      if (config.schema) {
        lines.push('');
        lines.push('**Schema:**');
        lines.push('```json');
        lines.push(JSON.stringify(config.schema, null, 2));
        lines.push('```');
      }

      return lines.join('\n');
    },
  };
}

/**
 * Create an examples block
 */
function createExamplesBlock(examples: readonly Example[]): ContextBlock {
  return {
    type: 'examples',
    priority: PRIORITY.EXAMPLES,
    isStatic: true,

    async render(variables?: Record<string, unknown>): Promise<string> {
      if (examples.length === 0) {
        return '';
      }

      const lines: string[] = [];
      lines.push('## Examples');
      lines.push('');

      for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        if (!example) continue;

        lines.push(`### Example ${i + 1}`);
        lines.push('');
        lines.push('**User:**');

        // Render template variables in examples
        const userContent = variables
          ? await renderTemplate(example.user, variables)
          : example.user;
        lines.push(userContent);
        lines.push('');

        lines.push('**Assistant:**');
        const assistantContent = variables
          ? await renderTemplate(example.assistant, variables)
          : example.assistant;
        lines.push(assistantContent);

        if (example.explanation) {
          lines.push('');
          lines.push(`*${example.explanation}*`);
        }

        lines.push('');
      }

      return lines.join('\n').trim();
    },
  };
}

/**
 * Create a context data block
 */
function createContextDataBlock(data: Record<string, unknown>): ContextBlock {
  return {
    type: 'context',
    priority: PRIORITY.CONTEXT,
    isStatic: false,

    async render(): Promise<string> {
      const lines: string[] = [];
      lines.push('## Context');
      lines.push('');

      for (const [key, value] of Object.entries(data)) {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        if (typeof value === 'object' && value !== null) {
          lines.push(`**${formattedKey}:**`);
          lines.push('```json');
          lines.push(JSON.stringify(value, null, 2));
          lines.push('```');
        } else {
          lines.push(`- ${formattedKey}: ${value}`);
        }
      }

      return lines.join('\n');
    },
  };
}

/**
 * Create a context builder
 *
 * @example
 * ```typescript
 * const context = createContext({
 *   identity: { name: 'Assistant', role: 'You are a helpful assistant.' },
 *   environment: { currentDateTime: true, timezone: true },
 *   instructions: ['Be concise.', 'Be accurate.'],
 * })
 *
 * const systemPrompt = await context.build()
 * ```
 */
export function createContext(config: ContextConfig = {}): IContextBuilder {
  const blocks: ContextBlock[] = [];

  // Initialize from config
  if (config.identity) {
    blocks.push(createIdentityBlock(config.identity));
  }

  if (config.environment) {
    blocks.push(createEnvironmentBlock(config.environment));
  }

  if (config.instructions && config.instructions.length > 0) {
    blocks.push(createInstructionsBlock(config.instructions));
  }

  if (config.outputFormat) {
    blocks.push(createOutputFormatBlock(config.outputFormat));
  }

  if (config.examples && config.examples.length > 0) {
    blocks.push(createExamplesBlock(config.examples));
  }

  if (config.context) {
    blocks.push(createContextDataBlock(config.context));
  }

  // Add custom blocks
  if (config.blocks) {
    blocks.push(...config.blocks);
  }

  const builder: IContextBuilder = {
    identity(identityConfig: IdentityConfig): IContextBuilder {
      blocks.push(createIdentityBlock(identityConfig));
      return builder;
    },

    environment(options: EnvironmentOptions | boolean = true): IContextBuilder {
      blocks.push(createEnvironmentBlock(options));
      return builder;
    },

    instructions(instructionList: readonly string[]): IContextBuilder {
      blocks.push(createInstructionsBlock(instructionList));
      return builder;
    },

    examples(exampleList: readonly Example[]): IContextBuilder {
      blocks.push(createExamplesBlock(exampleList));
      return builder;
    },

    outputFormat(formatConfig: OutputFormatConfig): IContextBuilder {
      blocks.push(createOutputFormatBlock(formatConfig));
      return builder;
    },

    block(customBlock: ContextBlock): IContextBuilder {
      blocks.push(customBlock);
      return builder;
    },

    context(data: Record<string, unknown>): IContextBuilder {
      blocks.push(createContextDataBlock(data));
      return builder;
    },

    async build(variables?: Record<string, unknown>): Promise<string> {
      // Sort blocks by priority
      const sortedBlocks = [...blocks].sort(
        (a, b) => (a.priority ?? PRIORITY.CUSTOM) - (b.priority ?? PRIORITY.CUSTOM)
      );

      const renderedParts: string[] = [];

      for (const block of sortedBlocks) {
        const rendered = await block.render(variables);
        if (rendered.trim()) {
          renderedParts.push(rendered);
        }
      }

      return renderedParts.join('\n\n');
    },

    async getStaticPortion(): Promise<string> {
      const staticBlocks = blocks
        .filter((b) => b.isStatic)
        .sort((a, b) => (a.priority ?? PRIORITY.CUSTOM) - (b.priority ?? PRIORITY.CUSTOM));

      const renderedParts: string[] = [];

      for (const block of staticBlocks) {
        const rendered = await block.render();
        if (rendered.trim()) {
          renderedParts.push(rendered);
        }
      }

      return renderedParts.join('\n\n');
    },

    async getDynamicPortion(variables?: Record<string, unknown>): Promise<string> {
      const dynamicBlocks = blocks
        .filter((b) => !b.isStatic)
        .sort((a, b) => (a.priority ?? PRIORITY.CUSTOM) - (b.priority ?? PRIORITY.CUSTOM));

      const renderedParts: string[] = [];

      for (const block of dynamicBlocks) {
        const rendered = await block.render(variables);
        if (rendered.trim()) {
          renderedParts.push(rendered);
        }
      }

      return renderedParts.join('\n\n');
    },
  };

  return builder;
}

/**
 * Create a custom context block
 *
 * @example
 * ```typescript
 * const customBlock = defineBlock({
 *   type: 'custom-rules',
 *   priority: 35,
 *   isStatic: true,
 *   render: async () => '## Custom Rules\n- Rule 1\n- Rule 2',
 * })
 * ```
 */
export function defineBlock(block: ContextBlock): ContextBlock {
  return block;
}

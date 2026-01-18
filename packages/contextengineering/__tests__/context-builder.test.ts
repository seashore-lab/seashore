/**
 * @seashorelab/contextengineering - Context Builder Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContext, defineBlock } from '../src/core/context-builder';

describe('createContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T14:30:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('identity', () => {
    it('should render identity block', async () => {
      const context = createContext({
        identity: {
          name: 'Assistant',
          role: 'You are a helpful AI assistant.',
        },
      });

      const result = await context.build();

      expect(result).toContain('## Identity');
      expect(result).toContain('**Assistant**');
      expect(result).toContain('helpful AI assistant');
    });

    it('should render personality traits', async () => {
      const context = createContext({
        identity: {
          name: 'Bot',
          personality: ['friendly', 'professional'],
        },
      });

      const result = await context.build();

      expect(result).toContain('**Personality:**');
      expect(result).toContain('- friendly');
      expect(result).toContain('- professional');
    });

    it('should render capabilities', async () => {
      const context = createContext({
        identity: {
          name: 'Bot',
          capabilities: ['Search', 'Translate'],
        },
      });

      const result = await context.build();

      expect(result).toContain('**Capabilities:**');
      expect(result).toContain('- Search');
      expect(result).toContain('- Translate');
    });

    it('should render constraints', async () => {
      const context = createContext({
        identity: {
          name: 'Bot',
          constraints: ['No personal advice'],
        },
      });

      const result = await context.build();

      expect(result).toContain('**Constraints:**');
      expect(result).toContain('- No personal advice');
    });
  });

  describe('environment', () => {
    it('should render environment block with boolean true', async () => {
      const context = createContext({
        environment: true,
      });

      const result = await context.build();

      expect(result).toContain('## Current Environment');
      expect(result).toContain('Current Date Time');
    });

    it('should render environment block with options', async () => {
      const context = createContext({
        environment: {
          weekday: true,
          locale: 'en-US',
        },
      });

      const result = await context.build();

      expect(result).toContain('Weekday');
    });
  });

  describe('instructions', () => {
    it('should render instructions block', async () => {
      const context = createContext({
        instructions: ['Be concise.', 'Be accurate.', 'Be helpful.'],
      });

      const result = await context.build();

      expect(result).toContain('## Instructions');
      expect(result).toContain('- Be concise.');
      expect(result).toContain('- Be accurate.');
      expect(result).toContain('- Be helpful.');
    });

    it('should not render empty instructions', async () => {
      const context = createContext({
        instructions: [],
      });

      const result = await context.build();

      expect(result).not.toContain('## Instructions');
    });
  });

  describe('outputFormat', () => {
    it('should render output format block', async () => {
      const context = createContext({
        outputFormat: {
          type: 'markdown',
          constraints: ['No code blocks', 'Keep it short'],
        },
      });

      const result = await context.build();

      expect(result).toContain('## Output Format');
      expect(result).toContain('- Format: markdown');
      expect(result).toContain('- No code blocks');
      expect(result).toContain('- Keep it short');
    });

    it('should render schema if provided', async () => {
      const context = createContext({
        outputFormat: {
          type: 'json',
          schema: { type: 'object', properties: { name: { type: 'string' } } },
        },
      });

      const result = await context.build();

      expect(result).toContain('**Schema:**');
      expect(result).toContain('"type": "object"');
    });
  });

  describe('examples', () => {
    it('should render examples block', async () => {
      const context = createContext({
        examples: [
          { user: 'Hello', assistant: 'Hi there!' },
          { user: 'What is 2+2?', assistant: '4' },
        ],
      });

      const result = await context.build();

      expect(result).toContain('## Examples');
      expect(result).toContain('### Example 1');
      expect(result).toContain('**User:**');
      expect(result).toContain('Hello');
      expect(result).toContain('**Assistant:**');
      expect(result).toContain('Hi there!');
      expect(result).toContain('### Example 2');
    });

    it('should render example explanations', async () => {
      const context = createContext({
        examples: [
          {
            user: 'Question',
            assistant: 'Answer',
            explanation: 'This shows how to respond.',
          },
        ],
      });

      const result = await context.build();

      expect(result).toContain('*This shows how to respond.*');
    });

    it('should not render empty examples', async () => {
      const context = createContext({
        examples: [],
      });

      const result = await context.build();

      expect(result).not.toContain('## Examples');
    });
  });

  describe('context data', () => {
    it('should render context data block', async () => {
      const context = createContext({
        context: {
          userName: 'Alice',
          orderId: '12345',
        },
      });

      const result = await context.build();

      expect(result).toContain('## Context');
      expect(result).toContain('- User Name: Alice');
      expect(result).toContain('- Order Id: 12345');
    });

    it('should render object values as JSON', async () => {
      const context = createContext({
        context: {
          settings: { theme: 'dark', fontSize: 14 },
        },
      });

      const result = await context.build();

      expect(result).toContain('**Settings:**');
      expect(result).toContain('```json');
      expect(result).toContain('"theme": "dark"');
    });
  });

  describe('fluent API', () => {
    it('should support method chaining', async () => {
      const context = createContext()
        .identity({ name: 'Bot' })
        .environment(true)
        .instructions(['Be helpful.'])
        .examples([{ user: 'Hi', assistant: 'Hello!' }])
        .outputFormat({ type: 'markdown' })
        .context({ userId: '123' });

      const result = await context.build();

      expect(result).toContain('## Identity');
      expect(result).toContain('## Current Environment');
      expect(result).toContain('## Instructions');
      expect(result).toContain('## Examples');
      expect(result).toContain('## Output Format');
      expect(result).toContain('## Context');
    });

    it('should add custom blocks', async () => {
      const customBlock = defineBlock({
        type: 'custom',
        priority: 25,
        isStatic: true,
        async render() {
          return '## Custom Section\n\nCustom content here.';
        },
      });

      const context = createContext().block(customBlock);

      const result = await context.build();

      expect(result).toContain('## Custom Section');
      expect(result).toContain('Custom content here.');
    });
  });

  describe('block ordering', () => {
    it('should order blocks by priority', async () => {
      const context = createContext({
        instructions: ['Instruction'], // priority 30
        identity: { name: 'Bot' }, // priority 10
        environment: true, // priority 20
      });

      const result = await context.build();

      const identityPos = result.indexOf('## Identity');
      const envPos = result.indexOf('## Current Environment');
      const instructionsPos = result.indexOf('## Instructions');

      expect(identityPos).toBeLessThan(envPos);
      expect(envPos).toBeLessThan(instructionsPos);
    });
  });

  describe('static/dynamic separation', () => {
    it('should get static portion', async () => {
      const context = createContext({
        identity: { name: 'Bot' }, // static
        instructions: ['Be helpful.'], // static
        environment: true, // dynamic
      });

      const staticPortion = await context.getStaticPortion();

      expect(staticPortion).toContain('## Identity');
      expect(staticPortion).toContain('## Instructions');
      expect(staticPortion).not.toContain('## Current Environment');
    });

    it('should get dynamic portion', async () => {
      const context = createContext({
        identity: { name: 'Bot' }, // static
        environment: true, // dynamic
      });

      const dynamicPortion = await context.getDynamicPortion();

      expect(dynamicPortion).toContain('## Current Environment');
      expect(dynamicPortion).not.toContain('## Identity');
    });
  });

  describe('template variables in examples', () => {
    it('should render template variables in examples', async () => {
      const context = createContext({
        examples: [
          {
            user: 'What time is it?',
            assistant: 'The current time is {{currentTime}}.',
          },
        ],
      });

      const result = await context.build({ currentTime: '14:30:00' });

      expect(result).toContain('The current time is 14:30:00.');
    });
  });
});

describe('defineBlock', () => {
  it('should create a valid context block', () => {
    const block = defineBlock({
      type: 'test',
      priority: 50,
      isStatic: true,
      async render() {
        return 'Test content';
      },
    });

    expect(block.type).toBe('test');
    expect(block.priority).toBe(50);
    expect(block.isStatic).toBe(true);
    expect(typeof block.render).toBe('function');
  });
});

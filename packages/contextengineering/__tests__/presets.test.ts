/**
 * @seashorelab/contextengineering - Presets Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  identity,
  timeAwareness,
  safetyGuidelines,
  codeGeneration,
  outputConstraints,
  presets,
} from '../src/presets/index';
import { createContext } from '../src/core/context-builder';

describe('identity preset', () => {
  it('should render identity block', async () => {
    const block = identity({ name: 'Assistant', role: 'helpful AI' });
    const result = await block.render();

    expect(result).toContain('## Identity');
    expect(result).toContain('**Assistant**');
    expect(result).toContain('helpful AI');
  });

  it('should render personality traits', async () => {
    const block = identity({
      name: 'Bot',
      personality: ['friendly', 'professional'],
    });
    const result = await block.render();

    expect(result).toContain('**Your personality traits:**');
    expect(result).toContain('- friendly');
    expect(result).toContain('- professional');
  });

  it('should use custom title', async () => {
    const block = identity({ name: 'Bot', title: 'Who You Are' });
    const result = await block.render();

    expect(result).toContain('## Who You Are');
  });

  it('should be static by default', () => {
    const block = identity({ name: 'Bot' });
    expect(block.isStatic).toBe(true);
  });
});

describe('timeAwareness preset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T14:30:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render time awareness block', async () => {
    const block = timeAwareness();
    const result = await block.render();

    expect(result).toContain('## Current Date and Time');
    expect(result).toContain('**Date & Time**');
  });

  it('should include weekday when enabled', async () => {
    const block = timeAwareness({ includeWeekday: true, locale: 'en-US' });
    const result = await block.render();

    expect(result).toContain('**Day**');
    expect(result).toContain('Saturday');
  });

  it('should include timezone when enabled', async () => {
    const block = timeAwareness({ includeTimezone: true });
    const result = await block.render();

    expect(result).toContain('**Timezone**');
  });

  it('should include usage hint', async () => {
    const block = timeAwareness();
    const result = await block.render();

    expect(result).toContain('Use this information when answering questions about time');
  });

  it('should be dynamic by default', () => {
    const block = timeAwareness();
    expect(block.isStatic).toBe(false);
  });

  it('should use custom title', async () => {
    const block = timeAwareness({ title: 'System Time' });
    const result = await block.render();

    expect(result).toContain('## System Time');
  });
});

describe('safetyGuidelines preset', () => {
  it('should render standard safety guidelines by default', async () => {
    const block = safetyGuidelines();
    const result = await block.render();

    expect(result).toContain('## Safety Guidelines');
    expect(result).toContain('harmful, hateful');
    expect(result).toContain('privacy');
  });

  it('should render minimal guidelines', async () => {
    const block = safetyGuidelines({ level: 'minimal' });
    const result = await block.render();

    const lines = result.split('\n').filter((l) => l.startsWith('- '));
    expect(lines.length).toBe(2);
  });

  it('should render strict guidelines', async () => {
    const block = safetyGuidelines({ level: 'strict' });
    const result = await block.render();

    expect(result).toContain('illegal activities');
    expect(result).toContain('cite sources');
  });

  it('should include custom guidelines', async () => {
    const block = safetyGuidelines({
      customGuidelines: ['Always verify information.'],
    });
    const result = await block.render();

    expect(result).toContain('Always verify information.');
  });

  it('should be static by default', () => {
    const block = safetyGuidelines();
    expect(block.isStatic).toBe(true);
  });
});

describe('codeGeneration preset', () => {
  it('should render code generation guidelines', async () => {
    const block = codeGeneration();
    const result = await block.render();

    expect(result).toContain('## Code Generation Guidelines');
    expect(result).toContain('**Code Style:**');
  });

  it('should list target languages', async () => {
    const block = codeGeneration({ languages: ['typescript', 'python'] });
    const result = await block.render();

    expect(result).toContain('**Target Languages:** typescript, python');
  });

  it('should render documented style', async () => {
    const block = codeGeneration({ style: 'documented' });
    const result = await block.render();

    expect(result).toContain('comprehensive documentation');
    expect(result).toContain('JSDoc/docstrings');
  });

  it('should render minimal style', async () => {
    const block = codeGeneration({ style: 'minimal' });
    const result = await block.render();

    expect(result).toContain('concise, minimal');
  });

  it('should include testing guidelines when enabled', async () => {
    const block = codeGeneration({ includeTests: true });
    const result = await block.render();

    expect(result).toContain('**Testing:**');
    expect(result).toContain('unit tests');
  });

  it('should be static by default', () => {
    const block = codeGeneration();
    expect(block.isStatic).toBe(true);
  });
});

describe('outputConstraints preset', () => {
  it('should render output constraints', async () => {
    const block = outputConstraints({ format: 'markdown' });
    const result = await block.render();

    expect(result).toContain('## Output Requirements');
    expect(result).toContain('Markdown formatting');
  });

  it('should include language', async () => {
    const block = outputConstraints({ language: 'English' });
    const result = await block.render();

    expect(result).toContain('Respond in English');
  });

  it('should include tone', async () => {
    const block = outputConstraints({ tone: 'professional' });
    const result = await block.render();

    expect(result).toContain('professional');
  });

  it('should include max length', async () => {
    const block = outputConstraints({ maxLength: 1000 });
    const result = await block.render();

    expect(result).toContain('under 1000 characters');
  });

  it('should be static by default', () => {
    const block = outputConstraints();
    expect(block.isStatic).toBe(true);
  });
});

describe('presets namespace', () => {
  it('should export all presets', () => {
    expect(presets.identity).toBe(identity);
    expect(presets.timeAwareness).toBe(timeAwareness);
    expect(presets.safetyGuidelines).toBe(safetyGuidelines);
    expect(presets.codeGeneration).toBe(codeGeneration);
    expect(presets.outputConstraints).toBe(outputConstraints);
  });
});

describe('integration with createContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T14:30:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should work with createContext blocks', async () => {
    const context = createContext({
      blocks: [
        identity({ name: 'CodeBot', role: 'coding assistant' }),
        timeAwareness({ locale: 'en-US' }),
        codeGeneration({ languages: ['typescript'] }),
        safetyGuidelines({ level: 'minimal' }),
      ],
    });

    const result = await context.build();

    expect(result).toContain('## Identity');
    expect(result).toContain('CodeBot');
    expect(result).toContain('## Current Date and Time');
    expect(result).toContain('## Code Generation Guidelines');
    expect(result).toContain('typescript');
    expect(result).toContain('## Safety Guidelines');
  });

  it('should respect block priority ordering', async () => {
    const context = createContext({
      blocks: [
        safetyGuidelines(), // priority 90
        identity({ name: 'Bot' }), // priority 10
        timeAwareness(), // priority 15
      ],
    });

    const result = await context.build();

    const identityPos = result.indexOf('## Identity');
    const timePos = result.indexOf('## Current Date and Time');
    const safetyPos = result.indexOf('## Safety Guidelines');

    expect(identityPos).toBeLessThan(timePos);
    expect(timePos).toBeLessThan(safetyPos);
  });
});

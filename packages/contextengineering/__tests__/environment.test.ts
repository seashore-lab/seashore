/**
 * @seashore/contextengineering - Environment Provider Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEnvironmentProvider, env, createEnv } from '../src/providers/environment';

describe('createEnvironmentProvider', () => {
  beforeEach(() => {
    // Mock Date to have consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T14:30:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getContext', () => {
    it('should return currentDateTime when enabled', async () => {
      const provider = createEnvironmentProvider({ currentDateTime: true });
      const context = await provider.getContext();

      expect(context.currentDateTime).toBeDefined();
      expect(context.currentDateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      );
    });

    it('should return timezone when enabled', async () => {
      const provider = createEnvironmentProvider({ timezone: true });
      const context = await provider.getContext();

      expect(context.timezone).toBeDefined();
      expect(typeof context.timezone).toBe('string');
    });

    it('should return currentDate when enabled', async () => {
      const provider = createEnvironmentProvider({
        currentDate: true,
        locale: 'en-US',
      });
      const context = await provider.getContext();

      expect(context.currentDate).toBeDefined();
      expect(typeof context.currentDate).toBe('string');
    });

    it('should return currentTime when enabled', async () => {
      const provider = createEnvironmentProvider({ currentTime: true });
      const context = await provider.getContext();

      expect(context.currentTime).toBeDefined();
      expect(context.currentTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should return utcOffset when enabled', async () => {
      const provider = createEnvironmentProvider({ utcOffset: true });
      const context = await provider.getContext();

      expect(context.utcOffset).toBeDefined();
      expect(context.utcOffset).toMatch(/^[+-]\d{2}:\d{2}$/);
    });

    it('should return weekday when enabled', async () => {
      const provider = createEnvironmentProvider({
        weekday: true,
        locale: 'en-US',
      });
      const context = await provider.getContext();

      expect(context.weekday).toBeDefined();
      // Should be Saturday for 2026-01-17
      expect(context.weekday).toBe('Saturday');
    });

    it('should return locale when provided', async () => {
      const provider = createEnvironmentProvider({ locale: 'zh-CN' });
      const context = await provider.getContext();

      expect(context.locale).toBe('zh-CN');
    });

    it('should handle custom variables', async () => {
      const provider = createEnvironmentProvider({
        custom: {
          staticValue: 'hello',
          dynamicValue: () => 'world',
          asyncValue: async () => 'async!',
        },
      });
      const context = await provider.getContext();

      expect(context.staticValue).toBe('hello');
      expect(context.dynamicValue).toBe('world');
      expect(context.asyncValue).toBe('async!');
    });

    it('should return empty context when nothing enabled', async () => {
      const provider = createEnvironmentProvider({});
      const context = await provider.getContext();

      expect(Object.keys(context)).toHaveLength(0);
    });
  });

  describe('format', () => {
    it('should format as markdown by default', async () => {
      const provider = createEnvironmentProvider({
        currentDateTime: true,
        timezone: true,
      });
      const formatted = await provider.format();

      expect(formatted).toContain('## Current Environment');
      expect(formatted).toContain('- Current Date Time:');
      expect(formatted).toContain('- Timezone:');
    });

    it('should format as yaml', async () => {
      const provider = createEnvironmentProvider({
        currentDateTime: true,
      });
      const formatted = await provider.format({ style: 'yaml' });

      expect(formatted).toContain('# Current Environment');
      expect(formatted).toContain('currentDateTime:');
    });

    it('should format as xml', async () => {
      const provider = createEnvironmentProvider({
        timezone: true,
      });
      const formatted = await provider.format({ style: 'xml' });

      expect(formatted).toContain('<environment>');
      expect(formatted).toContain('<timezone>');
      expect(formatted).toContain('</timezone>');
      expect(formatted).toContain('</environment>');
    });

    it('should format as plain text', async () => {
      const provider = createEnvironmentProvider({
        currentDateTime: true,
      });
      const formatted = await provider.format({ style: 'plain' });

      expect(formatted).not.toContain('##');
      expect(formatted).toContain('Current Date Time:');
    });

    it('should use custom title', async () => {
      const provider = createEnvironmentProvider({
        timezone: true,
      });
      const formatted = await provider.format({ title: 'System Info' });

      expect(formatted).toContain('## System Info');
    });

    it('should filter included keys', async () => {
      const provider = createEnvironmentProvider({
        currentDateTime: true,
        timezone: true,
        utcOffset: true,
      });
      const formatted = await provider.format({ include: ['timezone'] });

      expect(formatted).toContain('Timezone');
      expect(formatted).not.toContain('Current Date Time');
      expect(formatted).not.toContain('Utc Offset');
    });

    it('should filter excluded keys', async () => {
      const provider = createEnvironmentProvider({
        currentDateTime: true,
        timezone: true,
      });
      const formatted = await provider.format({ exclude: ['timezone'] });

      expect(formatted).toContain('Current Date Time');
      expect(formatted).not.toContain('Timezone');
    });
  });
});

describe('env shorthand', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17T14:30:00+08:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return formatted string with default options', async () => {
    const result = await env();

    expect(result).toContain('## Current Environment');
    expect(result).toContain('Current Date Time');
    expect(result).toContain('Timezone');
  });

  it('should accept custom options', async () => {
    const result = await env({ weekday: true, locale: 'en-US' });

    expect(result).toContain('Weekday');
    expect(result).toContain('Saturday');
  });

  it('should accept format options', async () => {
    const result = await env({ timezone: true }, { style: 'yaml' });

    expect(result).toContain('# Current Environment');
    expect(result).toContain('timezone:');
  });
});

describe('createEnv', () => {
  it('should return an EnvironmentProvider', () => {
    const provider = createEnv({ timezone: true });

    expect(provider).toHaveProperty('getContext');
    expect(provider).toHaveProperty('format');
    expect(typeof provider.getContext).toBe('function');
    expect(typeof provider.format).toBe('function');
  });
});

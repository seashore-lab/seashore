/**
 * @seashore/contextengineering - Template Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createTemplate,
  renderTemplate,
  hasTemplateVariables,
  extractTemplateVariables,
} from '../src/core/template';

describe('createTemplate', () => {
  describe('render', () => {
    it('should replace simple variables', async () => {
      const template = createTemplate('Hello {{name}}!');
      const result = await template.render({ name: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should handle multiple variables', async () => {
      const template = createTemplate('{{greeting}} {{name}}! Today is {{day}}.');
      const result = await template.render({
        greeting: 'Hello',
        name: 'Alice',
        day: 'Friday',
      });

      expect(result).toBe('Hello Alice! Today is Friday.');
    });

    it('should handle nested object properties', async () => {
      const template = createTemplate('User: {{user.name}}, Age: {{user.age}}');
      const result = await template.render({
        user: { name: 'Bob', age: 30 },
      });

      expect(result).toBe('User: Bob, Age: 30');
    });

    it('should handle deeply nested properties', async () => {
      const template = createTemplate('Value: {{a.b.c.d}}');
      const result = await template.render({
        a: { b: { c: { d: 'deep' } } },
      });

      expect(result).toBe('Value: deep');
    });

    it('should replace missing variables with empty string by default', async () => {
      const template = createTemplate('Hello {{missing}}!');
      const result = await template.render({});

      expect(result).toBe('Hello !');
    });

    it('should throw in strict mode for missing variables', async () => {
      const template = createTemplate('Hello {{missing}}!', { strict: true });

      await expect(template.render({})).rejects.toThrow('Template variable "missing" not found');
    });

    it('should use custom default value for missing variables', async () => {
      const template = createTemplate('Hello {{missing}}!', { defaultValue: '[N/A]' });
      const result = await template.render({});

      expect(result).toBe('Hello [N/A]!');
    });

    it('should handle whitespace in delimiters', async () => {
      const template = createTemplate('Hello {{ name }}!');
      const result = await template.render({ name: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should handle array values', async () => {
      const template = createTemplate('Items: {{items}}');
      const result = await template.render({ items: ['a', 'b', 'c'] });

      expect(result).toBe('Items: a, b, c');
    });

    it('should handle object values as JSON', async () => {
      const template = createTemplate('Data: {{data}}');
      const result = await template.render({ data: { key: 'value' } });

      expect(result).toBe('Data: {"key":"value"}');
    });

    it('should handle number values', async () => {
      const template = createTemplate('Count: {{count}}');
      const result = await template.render({ count: 42 });

      expect(result).toBe('Count: 42');
    });

    it('should handle boolean values', async () => {
      const template = createTemplate('Active: {{active}}');
      const result = await template.render({ active: true });

      expect(result).toBe('Active: true');
    });

    it('should handle null values', async () => {
      const template = createTemplate('Value: {{value}}');
      const result = await template.render({ value: null });

      expect(result).toBe('Value: ');
    });

    it('should preserve non-variable content', async () => {
      const template = createTemplate('# Title\n\nHello {{name}}!\n\n## Section');
      const result = await template.render({ name: 'World' });

      expect(result).toBe('# Title\n\nHello World!\n\n## Section');
    });
  });

  describe('getVariables', () => {
    it('should extract variable names', () => {
      const template = createTemplate('Hello {{name}}! Today is {{day}}.');
      const variables = template.getVariables();

      expect(variables).toEqual(['name', 'day']);
    });

    it('should extract nested variable paths', () => {
      const template = createTemplate('{{user.name}} - {{user.email}}');
      const variables = template.getVariables();

      expect(variables).toEqual(['user.name', 'user.email']);
    });

    it('should return unique variables only', () => {
      const template = createTemplate('{{name}} and {{name}} again');
      const variables = template.getVariables();

      expect(variables).toEqual(['name']);
    });

    it('should return empty array for no variables', () => {
      const template = createTemplate('No variables here');
      const variables = template.getVariables();

      expect(variables).toEqual([]);
    });
  });

  describe('raw property', () => {
    it('should preserve the original template string', () => {
      const templateString = 'Hello {{name}}!';
      const template = createTemplate(templateString);

      expect(template.raw).toBe(templateString);
    });
  });

  describe('custom delimiters', () => {
    it('should support custom delimiters', async () => {
      const template = createTemplate('Hello <%name%>!', {
        openDelimiter: '<%',
        closeDelimiter: '%>',
      });
      const result = await template.render({ name: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should support single character delimiters', async () => {
      const template = createTemplate('Hello {name}!', {
        openDelimiter: '{',
        closeDelimiter: '}',
      });
      const result = await template.render({ name: 'World' });

      expect(result).toBe('Hello World!');
    });
  });
});

describe('renderTemplate', () => {
  it('should render template string directly', async () => {
    const result = await renderTemplate('Hello {{name}}!', { name: 'World' });

    expect(result).toBe('Hello World!');
  });

  it('should accept options', async () => {
    const result = await renderTemplate(
      'Hello <%name%>!',
      { name: 'World' },
      { openDelimiter: '<%', closeDelimiter: '%>' }
    );

    expect(result).toBe('Hello World!');
  });
});

describe('hasTemplateVariables', () => {
  it('should return true for strings with variables', () => {
    expect(hasTemplateVariables('Hello {{name}}!')).toBe(true);
  });

  it('should return false for strings without variables', () => {
    expect(hasTemplateVariables('Hello World!')).toBe(false);
  });

  it('should support custom delimiters', () => {
    expect(hasTemplateVariables('Hello <%name%>!', '<%', '%>')).toBe(true);
    expect(hasTemplateVariables('Hello {{name}}!', '<%', '%>')).toBe(false);
  });
});

describe('extractTemplateVariables', () => {
  it('should extract variables from template string', () => {
    const variables = extractTemplateVariables('{{name}} - {{email}}');

    expect(variables).toEqual(['name', 'email']);
  });

  it('should support custom delimiters', () => {
    const variables = extractTemplateVariables('<%name%> - <%email%>', '<%', '%>');

    expect(variables).toEqual(['name', 'email']);
  });
});

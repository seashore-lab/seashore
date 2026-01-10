/**
 * Type hints test
 * This test verifies that model parameters provide type hints while allowing custom strings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openaiText, anthropicText, geminiText } from '../src/adapters.js';

// Mock the TanStack modules
vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat: vi.fn((model, apiKey, config) => ({
    model,
    apiKey,
    config,
    provider: 'openai',
  })),
  OPENAI_CHAT_MODELS: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'] as const,
}));

vi.mock('@tanstack/ai-anthropic', () => ({
  createAnthropicChat: vi.fn((model, apiKey, config) => ({
    model,
    apiKey,
    config,
    provider: 'anthropic',
  })),
  ANTHROPIC_MODELS: ['claude-sonnet-4', 'claude-opus-4', 'claude-3-7-sonnet'] as const,
}));

vi.mock('@tanstack/ai-gemini', () => ({
  createGeminiChat: vi.fn((model, apiKey, config) => ({
    model,
    apiKey,
    config,
    provider: 'gemini',
  })),
  GEMINI_MODELS: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'] as const,
}));

describe('Type Hints Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openaiText', () => {
    it('should work with known model names', () => {
      const adapter = openaiText('gpt-4o', { apiKey: 'test-key' });
      expect(adapter.model).toBe('gpt-4o');
    });

    it('should work with custom model names', () => {
      const adapter = openaiText('my-custom-gpt-model', { apiKey: 'test-key' });
      expect(adapter.model).toBe('my-custom-gpt-model');
    });
  });

  describe('anthropicText', () => {
    it('should work with known model names', () => {
      const adapter = anthropicText('claude-sonnet-4', { apiKey: 'test-key' });
      expect(adapter.model).toBe('claude-sonnet-4');
    });

    it('should work with custom model names', () => {
      const adapter = anthropicText('my-custom-claude-model', { apiKey: 'test-key' });
      expect(adapter.model).toBe('my-custom-claude-model');
    });
  });

  describe('geminiText', () => {
    it('should work with known model names', () => {
      const adapter = geminiText('gemini-2.0-flash', { apiKey: 'test-key' });
      expect(adapter.model).toBe('gemini-2.0-flash');
    });

    it('should work with custom model names', () => {
      const adapter = geminiText('my-custom-gemini-model', { apiKey: 'test-key' });
      expect(adapter.model).toBe('my-custom-gemini-model');
    });
  });
});

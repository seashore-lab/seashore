/**
 * Example 14 - Context Engineering
 *
 * This example demonstrates how to use @seashore/contextengineering to build
 * high-quality prompts that make your LLM aware of:
 * - Current time, date, and timezone
 * - Agent identity and capabilities
 * - Structured instructions
 * - Safety guidelines
 *
 * Context Engineering is the art and science of filling the context window
 * with just the right information for the LLM to accomplish its task.
 */

import 'dotenv/config';
import { createAgent } from '@seashore/agent';
import { openaiText } from '@seashore/llm';
import {
  createContext,
  createEnvironmentProvider,
  env,
  presets,
  createTemplate,
} from '@seashore/contextengineering';

async function main() {
  console.log('[Example 14: Context Engineering]\n');

  // ============================================
  // Part 1: Basic Environment Awareness
  // ============================================
  console.log('--- Part 1: Environment Awareness ---\n');

  // Create an environment provider to inject runtime information
  const envProvider = createEnvironmentProvider({
    currentDateTime: true,
    timezone: true,
    weekday: true,
    locale: 'en-US',
  });

  // Get the environment context
  const envContext = await envProvider.getContext();
  console.log('Environment Context:', envContext);

  // Format it for prompt injection
  const envFormatted = await envProvider.format();
  console.log('\nFormatted for Prompt:\n' + envFormatted);

  // ============================================
  // Part 2: Using the Context Builder
  // ============================================
  console.log('\n--- Part 2: Context Builder ---\n');

  // Build a structured prompt using createContext
  const context = createContext({
    identity: {
      name: 'TimeBot',
      role: 'You are a helpful assistant that is always aware of the current time.',
      personality: ['friendly', 'precise', 'helpful'],
      capabilities: [
        'Answer questions about current time and date',
        'Help with scheduling and time calculations',
        'Provide timezone conversions',
      ],
    },
    environment: {
      currentDateTime: true,
      timezone: true,
      weekday: true,
      locale: 'en-US',
    },
    instructions: [
      'Always reference the current time when answering time-related questions.',
      'Be precise with dates and times.',
      'When the user asks "what time is it", use the environment information provided.',
    ],
    examples: [
      {
        user: 'What time is it?',
        assistant:
          'Based on my current environment, the time is {{currentTime}}. How can I help you with your schedule today?',
      },
      {
        user: 'What day is it today?',
        assistant: 'Today is {{weekday}}. Is there anything specific you need help with?',
      },
    ],
  });

  // Build the complete system prompt
  const systemPrompt = await context.build({
    currentTime: envContext.currentDateTime,
    weekday: envContext.weekday,
  });

  console.log('Generated System Prompt:');
  console.log('========================');
  console.log(systemPrompt);
  console.log('========================\n');

  // ============================================
  // Part 3: Using Presets
  // ============================================
  console.log('--- Part 3: Using Presets ---\n');

  // Build a context using preset blocks
  const presetContext = createContext({
    blocks: [
      // Identity preset
      presets.identity({
        name: 'CodeAssistant',
        role: 'expert programming assistant',
        personality: ['technical', 'thorough', 'patient'],
      }),

      // Time awareness preset (solves the common "LLM doesn't know time" problem)
      presets.timeAwareness({
        locale: 'en-US',
        includeWeekday: true,
        includeTimezone: true,
      }),

      // Code generation preset
      presets.codeGeneration({
        languages: ['TypeScript', 'Python', 'JavaScript'],
        style: 'documented',
        includeTests: true,
      }),

      // Safety guidelines preset
      presets.safetyGuidelines({
        level: 'standard',
      }),

      // Output constraints preset
      presets.outputConstraints({
        format: 'markdown',
        tone: 'professional',
      }),
    ],
  });

  const presetPrompt = await presetContext.build();
  console.log('Preset-based System Prompt:');
  console.log('===========================');
  console.log(presetPrompt);
  console.log('===========================\n');

  // ============================================
  // Part 4: Template System
  // ============================================
  console.log('--- Part 4: Template System ---\n');

  // Create reusable templates with variable interpolation
  const template = createTemplate(
    `
# Agent Configuration

You are **{{agentName}}**, a {{role}} working at {{company}}.

## Current Context
- User: {{user.name}}
- User ID: {{user.id}}
- Session Started: {{sessionStart}}

## Your Responsibilities
{{#each responsibilities}}
- {{this}}
{{/each}}

Please assist the user with their requests.
  `.trim()
  );

  // Extract variables from template
  console.log('Template Variables:', template.getVariables());

  // Render the template
  const renderedTemplate = await template.render({
    agentName: 'SupportBot',
    role: 'customer support specialist',
    company: 'TechCorp',
    user: {
      name: 'Alice',
      id: 'U-12345',
    },
    sessionStart: new Date().toISOString(),
  });

  console.log('\nRendered Template:');
  console.log('==================');
  console.log(renderedTemplate);
  console.log('==================\n');

  // ============================================
  // Part 5: Static/Dynamic Separation (for Prompt Caching)
  // ============================================
  console.log('--- Part 5: Static/Dynamic Separation ---\n');

  const cachingContext = createContext({
    identity: { name: 'Assistant' }, // Static - can be cached
    instructions: ['Be helpful', 'Be concise'], // Static - can be cached
    environment: true, // Dynamic - changes every request
  });

  const staticPortion = await cachingContext.getStaticPortion();
  const dynamicPortion = await cachingContext.getDynamicPortion();

  console.log('Static Portion (cacheable):');
  console.log(staticPortion);
  console.log('\nDynamic Portion (per-request):');
  console.log(dynamicPortion);

  // ============================================
  // Part 6: Integration with Agent
  // ============================================
  console.log('\n--- Part 6: Integration with Agent ---\n');

  // Build a time-aware system prompt using shorthand
  const timeAwarePrompt =
    `You are a helpful assistant that always knows the current time.\n\n` +
    (await env({ currentDateTime: true, timezone: true, weekday: true, locale: 'en-US' })) +
    `\n\n## Instructions\n- When asked about time, use the current environment information.\n- Be precise and helpful.`;

  console.log('Time-Aware System Prompt:');
  console.log(timeAwarePrompt);

  // Create an agent with the time-aware prompt
  const agent = createAgent({
    name: 'time-aware-assistant',
    model: openaiText('gpt-5.1', {
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
    }),
    systemPrompt: timeAwarePrompt,
  });

  // Test the agent
  console.log('\n--- Agent Interaction ---\n');
  const userPrompt = 'What time is it right now?';
  console.log(`📝 User: ${userPrompt}`);

  try {
    const result = await agent.run(userPrompt);
    console.log(`🤖 Agent: ${result.content}`);
  } catch (error) {
    console.log('🤖 Agent: (Skipped - set OPENAI_API_KEY to test)');
  }

  console.log('\n✅ Context Engineering Example Complete!');
  console.log('\nKey Takeaways:');
  console.log('1. Use createEnvironmentProvider() to make LLMs aware of current time/date');
  console.log('2. Use createContext() to build structured, maintainable prompts');
  console.log('3. Use presets for common patterns (identity, time awareness, safety)');
  console.log('4. Use templates for reusable prompts with variables');
  console.log('5. Separate static/dynamic content for prompt caching optimization');
}

main().catch(console.error);

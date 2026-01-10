/**
 * Example 03 - Workflow Basic
 *
 * This example demonstrates how to create and execute a basic workflow.
 * The workflow consists of two LLM nodes: one for generating an outline
 * and another for generating content based on that outline.
 */

import 'dotenv/config';
import {
  createWorkflow,
  createLLMNode,
  type WorkflowContext,
  type LLMNodeOutput,
} from '@seashore/workflow';
import { openaiText } from '@seashore/llm';

async function main() {
  console.log('[Example 03: Workflow Basic]\n');

  const model = openaiText('gpt-5.1', {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  // Step 1: Generate outline
  const outlineNode = createLLMNode({
    // `name` property is used to distinguish nodes in the workflow
    name: 'generate-outline',
    model,
    systemPrompt:
      'You are an expert in article outlining. Generate a concise outline based on the given topic.',
    // `prompt` is a simple way to provide user input. It is automatically transformed into a user message.
    prompt: (input) =>
      `Please generate a brief article outline (2-3 key points) for the following topic:\n\nTopic: ${(input as { topic: string }).topic}`,
  });

  // Step 2: Generate content based on the outline
  const contentNode = createLLMNode({
    name: 'generate-content',
    model,
    systemPrompt:
      'You are an expert in article writing. Please write the content based on the outline (~150-200 words in total).',
    // `messages` allows full control over the message structure sent to the LLM
    // Use this if you need to build your own context, including conversation history, etc.
    // If both `prompt` and `messages` are provided, `messages` takes precedence.
    // Note that system prompts can only be set via `systemPrompt` property.
    // System messages inside `messages` will be ignored.
    messages: (input, ctx: WorkflowContext) => {
      // To access the output of previous nodes, use `ctx.getNodeOutput<T>()`.
      const outlineOutput = ctx.getNodeOutput<LLMNodeOutput>('generate-outline');
      const outline = outlineOutput?.content ?? '';
      return [
        {
          role: 'user',
          // Every node's `input` always receives the very first input of the workflow start node.
          content: `Topic: ${(input as { topic: string }).topic}\n\nOutline:\n${outline}\n\nPlease write the content based on the above outline.`,
        },
      ];
    },
  });

  // Create the workflow
  const workflow = createWorkflow<{ topic: string }>({
    name: 'article-generation',
    nodes: [outlineNode, contentNode],
    // Link nodes together
    edges: [{ from: 'generate-outline', to: 'generate-content' }],
    // Provide the entry point of the workflow
    startNode: 'generate-outline',
  });

  const topic = 'AI Development Trends in 2026';
  console.log(`📝 Topic: ${topic}\n`);

  // Execute the workflow. `execute` won't resolve until all nodes are completed.
  console.log('--- Starting workflow (`execute` mode) ---\n');
  const result = await workflow.execute({ topic });
  console.log('📄 Step 1 - Outline:');
  const outlineOutput = result.getNodeOutput<LLMNodeOutput>('generate-outline');
  console.log(outlineOutput?.content ?? '[No output]');
  console.log('📄 Step 2 - Content:');
  const contentOutput = result.getNodeOutput<LLMNodeOutput>('generate-content');
  console.log(contentOutput?.content ?? '[No output]');
  console.log('--- Workflow completed ---');
  console.log(`Total execution time: ${result.durationMs}ms`);

  // While `stream` streams token-level outputs as they are produced.
  console.log('\n--- Starting workflow (`stream` mode) ---\n');
  let currentNodeName = '';
  for await (const event of workflow.stream({ topic })) {
    switch (event.type) {
      case 'workflow_start':
        console.log('🚀 Workflow started\n');
        break;
      case 'node_start':
        currentNodeName = event.data.nodeName;
        console.log(`\n📍 Node started: ${currentNodeName}`);
        break;
      case 'llm_token':
        // Real-time token streaming. Each token is printed as it's generated.
        const delta = event.data.delta;
        process.stdout.write(delta);
        break;
      case 'node_complete':
        console.log(`\n   ✅ Node completed: ${event.data.nodeName}`);
        break;
      case 'workflow_complete':
        console.log('\n🎉 Workflow completed!\n');
        break;
      case 'workflow_error':
      case 'node_error':
        console.error(`\n❌ Error: ${JSON.stringify(event.data)}`);
        break;
    }
  }
}

main().catch(console.error);

// [Example 03: Workflow Basic]

// 📝 Topic: AI Development Trends in 2026

// --- Starting workflow (`execute` mode) ---

// 📄 Step 1 - Outline:
// 1. **Mainstream Adoption of Multimodal & Agentic AI**
//    - Expansion from text-only models to robust multimodal systems (text, image, audio, video, sensor data).
//    - Rise of AI agents that can plan, take actions across tools/APIs, and autonomously complete workflows in business and consumer apps.

// 2. **Shift Toward Smaller, Specialized & On-Device Models**
//    - Growth of domain-specific models optimized for particular industries (healthcare, finance, logistics, gaming).
//    - Increased deployment on edge devices (phones, laptops, cars, IoT) for privacy, latency, and cost benefits.

// 3. **Regulation, Safety, and Governance as Core Design Constraints**
//    - AI regulation (e.g., global standards, regional laws) shaping how models are trained, evaluated, and deployed.
//    - Stronger emphasis on robustness, red-teaming, alignment techniques, and transparent evaluation to manage risk and build trust.
// 📄 Step 2 - Content:
// Artificial intelligence is entering a new phase defined by three powerful shifts. First, mainstream adoption is moving beyond text-only models to rich multimodal systems that understand and generate text, images, audio, video, and even sensor data. At the same time, “agentic” AI is emerging—systems that can plan, call tools and APIs, and autonomously execute multi-step workflows inside business software and consumer apps, from automating back-office processes to orchestrating personal tasks.

// Second, the industry is pivoting toward smaller, specialized, and on-device models. Instead of one-size-fits-all giants, organizations are embracing domain-specific models tailored to healthcare, finance, logistics, and gaming. Running these models on edge devices such as phones, laptops, vehicles, and IoT hardware improves privacy, reduces latency, and cuts infrastructure costs.

// Finally, regulation, safety, and governance are becoming core design constraints rather than afterthoughts. Emerging global standards and regional laws are reshaping how models are trained, evaluated, and deployed. This drives a stronger focus on robustness testing, adversarial red-teaming, alignment methods, and transparent benchmarks—all essential to managing risk and building durable public and enterprise trust in AI.
// --- Workflow completed ---
// Total execution time: 7485ms

// --- Starting workflow (`stream` mode) ---

// 🚀 Workflow started

// 📍 Node started: generate-outline
// 1. **Maturation of Multimodal and Agentic AI**
//    - Widespread deployment of models that seamlessly handle text, images, audio, and video in a single workflow.
//    - Rise of AI “agents” that can plan, take actions across tools/APIs, and autonomously execute multi-step tasks.

// 2. **Engineering for Reliability, Safety, and Governance**
//    - Stronger emphasis on verifiable reasoning, evaluation benchmarks, and robust red-teaming to reduce hallucinations and misuse.
//    - Expanded regulatory frameworks and corporate AI governance (audits, model cards, safety standards) shaping how systems are built and deployed.

// 3. **Specialization and On-Device/Edge AI**
//    - Growth of domain-specific and smaller, efficient models tuned for particular industries (health, finance, education, etc.).
//    - Increasing use of AI on local devices and edge hardware for privacy, latency, and cost reasons, supported by optimized architectures and hardware advances.
//    ✅ Node completed: generate-outline

// 📍 Node started: generate-content
// The next phase of AI will be defined by three reinforcing trends. First, multimodal and agentic AI will mature from experimental demos into everyday infrastructure. Models will fluidly process text, images, audio, and video in a single workflow, enabling richer interfaces and more accurate understanding of context. On top of this, AI “agents” will increasingly plan, call tools and APIs, and autonomously complete multi-step tasks, turning today’s chatbots into capable digital coworkers.

// Second, engineering efforts will shift heavily toward reliability, safety, and governance. Organizations will invest in verifiable reasoning, rigorous benchmarks, and systematic red-teaming to curb hallucinations and abuse. Meanwhile, regulators and companies will roll out audits, model cards, and formal safety standards that determine how systems are designed, deployed, and monitored at scale.

// Finally, the era of one-size-fits-all models will give way to specialization and edge AI. Highly tuned, smaller models will emerge for specific domains like healthcare, finance, and education. At the same time, advances in architectures and hardware will push more AI onto local devices and edge systems, delivering better privacy, lower latency, and reduced costs while keeping intelligence close to where data is generated.
//    ✅ Node completed: generate-content

// 🎉 Workflow completed!

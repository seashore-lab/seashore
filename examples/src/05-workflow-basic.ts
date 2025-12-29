/**
 * Example 05 - Workflow Basic
 *
 * 展示如何创建简单的两步工作流：
 * 1. 第一步：生成文章大纲
 * 2. 第二步：根据大纲生成正文
 */

import 'dotenv/config';
import { createWorkflow, createLLMNode, type WorkflowContext } from '@seashore/workflow';

async function main() {
  console.log('🤖 Example 05: Workflow Basic\n');

  // 创建适配器对象（workflow 包需要 provider 属性）
  const adapter = {
    provider: 'openai' as const,
    model: 'gpt-4o',
  };

  // 步骤 1：生成大纲
  const outlineNode = createLLMNode({
    name: 'generate-outline',
    adapter,
    systemPrompt: '你是一个文章大纲生成专家。请根据主题生成简洁的文章大纲。',
    prompt: (input) =>
      `请为以下主题生成一个简短的文章大纲（3-4个要点）：\n\n主题：${(input as { topic: string }).topic}`,
  });

  // 步骤 2：根据大纲生成正文
  const contentNode = createLLMNode({
    name: 'generate-content',
    adapter,
    systemPrompt: '你是一个文章写作专家。请根据大纲撰写正文。',
    messages: (input, ctx: WorkflowContext) => {
      const outlineOutput = ctx.nodeOutputs['generate-outline'] as { content: string } | undefined;
      const outline = outlineOutput?.content ?? '';
      return [
        { role: 'system', content: '你是一个文章写作专家。请根据大纲撰写正文（150字以内）。' },
        {
          role: 'user',
          content: `主题：${(input as { topic: string }).topic}\n\n大纲：\n${outline}\n\n请根据以上大纲撰写正文。`,
        },
      ];
    },
  });

  // 创建工作流
  const workflow = createWorkflow({
    name: 'article-generation',
    nodes: [outlineNode, contentNode],
    edges: [{ from: 'generate-outline', to: 'generate-content' }],
    startNode: 'generate-outline',
  });

  const topic = 'TypeScript 的优势';
  console.log(`📝 主题: ${topic}\n`);
  console.log('--- 开始工作流 ---\n');

  // 执行工作流
  const result = await workflow.execute({ topic });

  console.log('📋 步骤 1 - 大纲:');
  const outlineOutput = result.nodeOutputs['generate-outline'] as { content: string } | undefined;
  console.log(outlineOutput?.content ?? '[无输出]');

  console.log('\n📄 步骤 2 - 正文:');
  const contentOutput = result.nodeOutputs['generate-content'] as { content: string } | undefined;
  console.log(contentOutput?.content ?? '[无输出]');

  console.log('\n--- 工作流完成 ---');
  console.log(`总执行时间: ${result.durationMs}ms`);
}

main().catch(console.error);

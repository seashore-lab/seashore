/**
 * Example 06 - RAG Knowledge Base
 *
 * 展示如何使用 RAG 构建知识库问答系统。
 * 包含：加载文档、分割、向量化、检索。
 *
 * 注意：此示例演示 RAG 的基本概念，完整集成需要配置 VectorDB
 */

import 'dotenv/config';
import {
  createStringLoader,
  createRecursiveSplitter,
  createInMemoryRetriever,
  type DocumentChunk,
} from '@seashore/rag';

async function main() {
  console.log('🤖 Example 06: RAG Knowledge Base\n');

  // 模拟的知识库内容
  const knowledgeContent = `
# Seashore 框架简介
Seashore 是一个 TypeScript AI Agent 框架，专注于类型安全和模块化设计。
它基于 @tanstack/ai 构建，支持多种 LLM 提供商。

# 核心功能
- Agent: 创建智能代理，支持工具调用
- Tool: 定义类型安全的工具，使用 Zod 进行参数验证
- Workflow: 构建多步骤工作流，支持条件分支和并行执行
- RAG: 检索增强生成，支持多种文档格式
- Memory: 短期/中期/长期记忆管理

# 安装指南
使用 pnpm 安装核心包:
pnpm add @seashore/agent @seashore/llm @seashore/tool

# 快速开始
创建一个简单的 Agent:
1. 导入 createAgent 和 openaiText
2. 配置 name、model、systemPrompt
3. 调用 agent.run("你的问题") 获取回答
`;

  // 1. 创建文档加载器
  console.log('📚 步骤 1: 加载文档');
  const loader = createStringLoader(knowledgeContent);
  const loadedDocs = await loader.load();
  console.log(`   加载了 ${loadedDocs.length} 个文档\n`);

  // 2. 创建文档分割器
  console.log('✂️ 步骤 2: 分割文档');
  const splitter = createRecursiveSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
  });

  // 分割所有文档
  const chunks: DocumentChunk[] = [];
  for (const doc of loadedDocs) {
    const docChunks = await splitter.split(doc);
    chunks.push(...docChunks);
  }
  console.log(`   分割为 ${chunks.length} 个块\n`);

  // 显示分割结果
  console.log('📄 分割结果预览:');
  chunks.slice(0, 3).forEach((chunk, i) => {
    const preview = chunk.content.slice(0, 60).replace(/\n/g, ' ');
    console.log(`   ${i + 1}. "${preview}..."`);
  });
  console.log();

  // 3. 创建嵌入函数（模拟 - 实际应用中使用 openaiEmbed）
  console.log('🔢 步骤 3: 创建向量嵌入');
  const embeddingFn = async (texts: readonly string[]): Promise<number[][]> => {
    // 实际应用中使用:
    // import { openaiEmbed, generateBatchEmbeddings } from '@seashore/llm';
    // const embedder = openaiEmbed('text-embedding-3-small');
    // const result = await generateBatchEmbeddings(embedder, texts);
    // return result.embeddings;

    // 这里使用模拟的嵌入向量
    console.log(`   为 ${texts.length} 个文本生成嵌入向量`);
    return texts.map(() =>
      Array(1536)
        .fill(0)
        .map(() => Math.random())
    );
  };

  // 4. 创建内存检索器
  console.log('\n🔍 步骤 4: 创建内存检索器');
  const retriever = createInMemoryRetriever(embeddingFn);

  // 添加文档到检索器
  await retriever.addDocuments(chunks);
  console.log('   文档已添加到检索器\n');

  // 5. 测试检索
  console.log('--- 测试检索 ---\n');
  const testQuestions = [
    '什么是 Seashore 框架？',
    'Seashore 有哪些核心功能？',
    '如何安装 Seashore？',
  ];

  for (const question of testQuestions) {
    console.log(`📝 问题: ${question}`);
    const retrieved = await retriever.retrieve(question);
    console.log(`📋 检索到 ${retrieved.length} 个相关片段`);
    if (retrieved.length > 0) {
      const preview = retrieved[0].content.slice(0, 80).replace(/\n/g, ' ');
      console.log(`   最相关: "${preview}..."`);
      console.log(`   相似度: ${(retrieved[0].score * 100).toFixed(1)}%`);
    }
    console.log();
  }

  console.log('--- RAG 示例完成 ---');
  console.log('\n💡 提示:');
  console.log('   1. 将 embeddingFn 替换为真实的嵌入服务');
  console.log('   2. 使用 createRAGPipeline 集成 LLM 生成回答');
  console.log('   3. 参考 @seashore/vectordb 使用持久化向量存储');
}

main().catch(console.error);

/**
 * @seashore/evaluation - 评估模块接口契约
 *
 * 提供 Agent 性能评估、响应质量评估
 * 支持自定义评估指标和基准测试
 */

// ============================================================================
// Evaluation Dataset
// ============================================================================

/**
 * 评估样本
 */
export interface EvaluationSample {
  id: string
  input: string
  expectedOutput?: string
  context?: string[]
  metadata?: Record<string, unknown>
}

/**
 * 评估数据集
 */
export interface EvaluationDataset {
  id: string
  name: string
  description?: string
  samples: EvaluationSample[]
  metadata?: Record<string, unknown>
}

/**
 * 数据集加载器配置
 */
export interface DatasetLoaderConfig {
  /**
   * 数据源类型
   */
  source: 'json' | 'csv' | 'jsonl' | 'huggingface'

  /**
   * 文件路径或 HuggingFace 数据集 ID
   */
  path: string

  /**
   * 列映射
   */
  columnMapping?: {
    input: string
    expectedOutput?: string
    context?: string
  }

  /**
   * 采样数量
   */
  sampleSize?: number
}

// ============================================================================
// Evaluators
// ============================================================================

/**
 * 评估结果
 */
export interface EvaluationResult {
  sampleId: string
  input: string
  actualOutput: string
  expectedOutput?: string
  scores: Record<string, number>
  passed: boolean
  reasoning?: string
  latencyMs: number
  tokenUsage?: {
    input: number
    output: number
  }
}

/**
 * 评估器接口
 */
export interface Evaluator {
  name: string
  description?: string

  /**
   * 评估单个样本
   */
  evaluate(
    input: string,
    actualOutput: string,
    expectedOutput?: string,
    context?: string[]
  ): Promise<{
    score: number // 0-1
    passed: boolean
    reasoning?: string
  }>
}

/**
 * 内置评估器类型
 */
export type BuiltinEvaluatorType =
  | 'exact_match' // 精确匹配
  | 'contains' // 包含检查
  | 'similarity' // 语义相似度
  | 'factuality' // 事实准确性 (LLM-based)
  | 'relevance' // 相关性 (LLM-based)
  | 'coherence' // 连贯性 (LLM-based)
  | 'helpfulness' // 有用性 (LLM-based)
  | 'harmlessness' // 无害性 (LLM-based)
  | 'groundedness' // 基于上下文 (RAG)
  | 'answer_correctness' // 答案正确性 (RAG)
  | 'context_precision' // 上下文精确度 (RAG)
  | 'context_recall' // 上下文召回率 (RAG)
  | 'latency' // 延迟
  | 'token_efficiency' // Token 效率

/**
 * 评估器配置
 */
export interface EvaluatorConfig {
  /**
   * 评估器类型
   */
  type: BuiltinEvaluatorType | 'custom'

  /**
   * 通过阈值
   */
  threshold?: number

  /**
   * LLM 客户端 (LLM-based 评估器需要)
   */
  llm?: unknown // LLMClient

  /**
   * 嵌入客户端 (相似度评估需要)
   */
  embeddingClient?: unknown // EmbeddingClient

  /**
   * 自定义评估函数
   */
  customFn?: (
    input: string,
    actualOutput: string,
    expectedOutput?: string
  ) => Promise<number>
}

// ============================================================================
// Evaluation Runner
// ============================================================================

/**
 * 评估运行配置
 */
export interface EvaluationRunConfig {
  /**
   * 评估数据集
   */
  dataset: EvaluationDataset

  /**
   * 要评估的 Agent 或函数
   */
  target: EvaluationTarget

  /**
   * 评估器列表
   */
  evaluators: Evaluator[]

  /**
   * 并发数
   */
  concurrency?: number

  /**
   * 超时 (毫秒)
   */
  timeout?: number

  /**
   * 进度回调
   */
  onProgress?: (progress: EvaluationProgress) => void
}

/**
 * 评估目标
 */
export type EvaluationTarget =
  | { type: 'agent'; agent: unknown } // Agent
  | { type: 'function'; fn: (input: string) => Promise<string> }

/**
 * 评估进度
 */
export interface EvaluationProgress {
  completed: number
  total: number
  currentSample?: EvaluationSample
  errors: number
}

/**
 * 评估报告
 */
export interface EvaluationReport {
  id: string
  name: string
  timestamp: Date
  duration: number // 毫秒
  results: EvaluationResult[]
  summary: EvaluationSummary
  metadata?: Record<string, unknown>
}

/**
 * 评估摘要
 */
export interface EvaluationSummary {
  totalSamples: number
  passedSamples: number
  failedSamples: number
  errorSamples: number
  passRate: number
  averageScores: Record<string, number>
  averageLatency: number
  totalTokens: {
    input: number
    output: number
  }
  evaluatorResults: Record<
    string,
    {
      averageScore: number
      passRate: number
      minScore: number
      maxScore: number
    }
  >
}

/**
 * 评估运行器接口
 */
export interface EvaluationRunner {
  /**
   * 运行评估
   */
  run(config: EvaluationRunConfig): Promise<EvaluationReport>

  /**
   * 比较两次评估
   */
  compare(report1: EvaluationReport, report2: EvaluationReport): EvaluationComparison
}

/**
 * 评估比较结果
 */
export interface EvaluationComparison {
  improved: string[] // 改进的指标
  regressed: string[] // 退步的指标
  unchanged: string[] // 未变的指标
  diff: Record<
    string,
    {
      before: number
      after: number
      change: number
      changePercent: number
    }
  >
}

// ============================================================================
// Benchmark
// ============================================================================

/**
 * 基准测试配置
 */
export interface BenchmarkConfig {
  /**
   * 基准测试名称
   */
  name: string

  /**
   * 预热次数
   */
  warmup?: number

  /**
   * 迭代次数
   */
  iterations: number

  /**
   * 并发数
   */
  concurrency?: number

  /**
   * 测试用例
   */
  cases: BenchmarkCase[]
}

/**
 * 基准测试用例
 */
export interface BenchmarkCase {
  name: string
  input: string
  target: EvaluationTarget
}

/**
 * 基准测试结果
 */
export interface BenchmarkResult {
  name: string
  timestamp: Date
  cases: BenchmarkCaseResult[]
}

/**
 * 基准测试用例结果
 */
export interface BenchmarkCaseResult {
  name: string
  iterations: number
  latency: {
    min: number
    max: number
    mean: number
    median: number
    p95: number
    p99: number
  }
  throughput: number // 请求/秒
  tokenUsage: {
    inputMean: number
    outputMean: number
  }
  errors: number
}

/**
 * 基准测试运行器接口
 */
export interface BenchmarkRunner {
  /**
   * 运行基准测试
   */
  run(config: BenchmarkConfig): Promise<BenchmarkResult>
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建评估器
 *
 * @example
 * ```typescript
 * import { createEvaluator } from "@seashore/evaluation";
 *
 * // 内置评估器
 * const exactMatch = createEvaluator({ type: "exact_match" });
 * const similarity = createEvaluator({
 *   type: "similarity",
 *   threshold: 0.8,
 *   embeddingClient,
 * });
 * const factuality = createEvaluator({
 *   type: "factuality",
 *   llm,
 * });
 *
 * // 自定义评估器
 * const custom = createEvaluator({
 *   type: "custom",
 *   customFn: async (input, output, expected) => {
 *     // 返回 0-1 的分数
 *     return output.includes("answer") ? 1 : 0;
 *   },
 * });
 * ```
 */
export function createEvaluator(config: EvaluatorConfig): Evaluator

/**
 * 加载评估数据集
 *
 * @example
 * ```typescript
 * import { loadDataset } from "@seashore/evaluation";
 *
 * // 从 JSON 文件加载
 * const dataset = await loadDataset({
 *   source: "json",
 *   path: "./test-data.json",
 * });
 *
 * // 从 CSV 加载
 * const csvDataset = await loadDataset({
 *   source: "csv",
 *   path: "./test-data.csv",
 *   columnMapping: {
 *     input: "question",
 *     expectedOutput: "answer",
 *   },
 * });
 * ```
 */
export function loadDataset(config: DatasetLoaderConfig): Promise<EvaluationDataset>

/**
 * 创建评估运行器
 *
 * @example
 * ```typescript
 * import { createEvaluationRunner, createEvaluator, loadDataset } from "@seashore/evaluation";
 *
 * const runner = createEvaluationRunner();
 *
 * const report = await runner.run({
 *   dataset: await loadDataset({ source: "json", path: "./data.json" }),
 *   target: { type: "agent", agent: myAgent },
 *   evaluators: [
 *     createEvaluator({ type: "exact_match" }),
 *     createEvaluator({ type: "similarity", embeddingClient }),
 *     createEvaluator({ type: "factuality", llm }),
 *   ],
 *   concurrency: 5,
 *   onProgress: (p) => console.log(`${p.completed}/${p.total}`),
 * });
 *
 * console.log("Pass rate:", report.summary.passRate);
 * console.log("Average latency:", report.summary.averageLatency);
 * ```
 */
export function createEvaluationRunner(): EvaluationRunner

/**
 * 创建基准测试运行器
 *
 * @example
 * ```typescript
 * import { createBenchmarkRunner } from "@seashore/evaluation";
 *
 * const runner = createBenchmarkRunner();
 *
 * const result = await runner.run({
 *   name: "agent-benchmark",
 *   warmup: 3,
 *   iterations: 100,
 *   concurrency: 10,
 *   cases: [
 *     {
 *       name: "simple-query",
 *       input: "What is 2+2?",
 *       target: { type: "agent", agent: myAgent },
 *     },
 *     {
 *       name: "complex-query",
 *       input: "Explain quantum computing",
 *       target: { type: "agent", agent: myAgent },
 *     },
 *   ],
 * });
 *
 * console.log("P95 latency:", result.cases[0].latency.p95);
 * console.log("Throughput:", result.cases[0].throughput);
 * ```
 */
export function createBenchmarkRunner(): BenchmarkRunner

// ============================================================================
// Report Generation
// ============================================================================

/**
 * 报告格式
 */
export type ReportFormat = 'json' | 'html' | 'markdown'

/**
 * 生成评估报告
 */
export function generateReport(
  report: EvaluationReport,
  format: ReportFormat
): Promise<string>

/**
 * 保存评估报告
 */
export function saveReport(
  report: EvaluationReport,
  path: string,
  format?: ReportFormat
): Promise<void>

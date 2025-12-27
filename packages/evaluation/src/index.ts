/**
 * @seashore/evaluation
 * Agent evaluation and metrics package
 * @module @seashore/evaluation
 */

// Types
export type {
  Metric,
  MetricConfig,
  MetricResult,
  TestCase,
  EvaluationResult,
  BatchEvaluationResult,
  Evaluator,
  EvaluatorConfig,
  Dataset,
  DatasetConfig,
  ReportFormat,
  ReportConfig,
  EvaluationReport,
  TextAdapter,
} from './types';

// Evaluator
export { createEvaluator } from './evaluator';

// Evaluate functions
export {
  evaluate,
  evaluateBatch,
  type EvaluateOptions,
  type EvaluateBatchOptions,
} from './evaluate';

// Metrics
export {
  relevanceMetric,
  faithfulnessMetric,
  coherenceMetric,
  harmfulnessMetric,
  customMetric,
  type RelevanceMetricConfig,
  type FaithfulnessMetricConfig,
  type CoherenceMetricConfig,
  type HarmfulnessMetricConfig,
  type CustomLLMMetricConfig,
  type CustomRuleMetricConfig,
} from './metrics';

// Dataset
export { createDataset, loadDataset } from './dataset';

// Report
export { generateReport } from './report';

/**
 * @seashore/observability
 * Observability package for agent tracing, logging, and metrics
 * @module @seashore/observability
 */

// Types
export type {
  Span,
  SpanEvent,
  SpanType,
  Tracer,
  TracerConfig,
  SpanExporter,
  ExporterConfig,
  TokenCounter,
  TokenCounterConfig,
  TokenEstimate,
  TokenCost,
  Logger,
  LoggerConfig,
  LogLevel,
  LogEntry,
} from './types';

// Tracer
export { createTracer } from './tracer';

// Token Counter
export { createTokenCounter } from './tokens';

// Logger
export { createLogger } from './logger';

// Middleware
export {
  observabilityMiddleware,
  createAgentObserver,
  type ObservabilityContext,
} from './middleware';

// Exporters
export {
  createOTLPExporter,
  createConsoleExporter,
  type OTLPExporterConfig,
  type ConsoleExporterConfig,
} from './exporters/index';

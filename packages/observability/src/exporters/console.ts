/**
 * Console exporter for development and debugging
 * @module @seashorelab/observability
 */

import type { Span, SpanExporter, BaseExporterConfig } from '../types';

/**
 * Console exporter configuration
 */
export interface ConsoleExporterConfig extends BaseExporterConfig {
  type: 'console';
  /** Output format */
  format?: 'json' | 'pretty';
  /** Whether to include attributes */
  includeAttributes?: boolean;
  /** Whether to include events */
  includeEvents?: boolean;
  /** Custom output function (defaults to console.log) */
  output?: (message: string) => void;
}

/**
 * Format span as pretty string
 */
function formatSpanPretty(span: Span, config: ConsoleExporterConfig): string {
  const duration = span.endTime ? span.endTime.getTime() - span.startTime.getTime() : 0;

  const statusCode = span.status.code;
  const statusIcon = statusCode === 'ok' ? '✓' : statusCode === 'error' ? '✗' : '○';
  const statusColor =
    statusCode === 'ok' ? '\x1b[32m' : statusCode === 'error' ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';

  let output = `${statusColor}${statusIcon}${reset} ${span.name} (${duration}ms)`;

  const parentId = span.parentContext?.spanId;
  if (parentId) {
    output += ` [parent: ${parentId.slice(0, 8)}]`;
  }

  if (config.includeAttributes && Object.keys(span.attributes).length > 0) {
    output += '\n  Attributes:';
    for (const [key, value] of Object.entries(span.attributes)) {
      output += `\n    ${key}: ${JSON.stringify(value)}`;
    }
  }

  if (config.includeEvents && span.events.length > 0) {
    output += '\n  Events:';
    for (const event of span.events) {
      output += `\n    [${event.timestamp.toISOString()}] ${event.name}`;
      if (event.attributes) {
        output += ` ${JSON.stringify(event.attributes)}`;
      }
    }
  }

  if (span.status.message) {
    output += `\n  Error: ${span.status.message}`;
  }

  return output;
}

/**
 * Format span as JSON string
 */
function formatSpanJSON(span: Span, config: ConsoleExporterConfig): string {
  const data: Record<string, unknown> = {
    traceId: span.context.traceId,
    spanId: span.context.spanId,
    parentId: span.parentContext?.spanId,
    name: span.name,
    type: span.type,
    startTime: span.startTime.toISOString(),
    endTime: span.endTime?.toISOString(),
    durationMs: span.endTime ? span.endTime.getTime() - span.startTime.getTime() : 0,
    status: span.status,
  };

  if (config.includeAttributes) {
    data.attributes = span.attributes;
  }

  if (config.includeEvents) {
    data.events = span.events.map((e) => ({
      name: e.name,
      timestamp: e.timestamp.toISOString(),
      attributes: e.attributes,
    }));
  }

  if (span.status.message) {
    data.error = {
      name: 'Error',
      message: span.status.message,
    };
  }

  return JSON.stringify(data);
}

/**
 * Create console exporter
 * Outputs spans to the console for development and debugging
 * @param config - Console exporter configuration
 * @returns SpanExporter instance
 * @example
 * ```typescript
 * const exporter = createConsoleExporter({
 *   format: 'pretty',
 *   includeAttributes: true
 * })
/**
 * Console exporter configuration (without type for internal use)
 */
type InternalConsoleConfig = Omit<ConsoleExporterConfig, 'type'>;

/**
 * Create console exporter
 * Logs spans to console for development and debugging
 * @param config - Console exporter configuration
 * @returns SpanExporter instance
 * @example
 * ```typescript
 * const exporter = createConsoleExporter({
 *   format: 'pretty',
 *   includeAttributes: true
 * })
 *
 * const tracer = createTracer({
 *   serviceName: 'my-agent',
 *   exporter
 * })
 * ```
 */
export function createConsoleExporter(config: InternalConsoleConfig = {}): SpanExporter {
  const {
    format = 'pretty',
    includeAttributes = true,
    includeEvents = false,
    output = console.log,
  } = config;

  const formatSpan = format === 'json' ? formatSpanJSON : formatSpanPretty;
  const fullConfig: ConsoleExporterConfig = {
    type: 'console',
    format,
    includeAttributes,
    includeEvents,
    output,
  };

  return {
    export: async (spans: Span[]): Promise<void> => {
      for (const span of spans) {
        output(formatSpan(span, fullConfig));
      }
    },

    shutdown: async (): Promise<void> => {
      // No cleanup needed for console exporter
    },
  };
}

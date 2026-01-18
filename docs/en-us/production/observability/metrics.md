# Metrics & Exporters

Seashore’s observability package focuses on traces and logs, and can export trace data.

In production:

- export spans via OTLP
- derive metrics (latency, tool-call rate, error rate) from traces
- combine with application metrics (HTTP, DB)

If you already run OpenTelemetry, the OTLP exporter is the most direct integration.

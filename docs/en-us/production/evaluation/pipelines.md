# Evaluation Pipelines

In CI or nightly runs, evaluation becomes a pipeline:

- load dataset
- run agent under fixed configuration
- compute metrics
- generate a report
- compare against baseline

Tips:

- keep datasets versioned
- pin evaluator prompts
- record model versions and temperatures

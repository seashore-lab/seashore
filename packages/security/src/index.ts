/**
 * @seashore/security
 * Security guardrails and content filtering package
 * @module @seashore/security
 */

// Types
export type {
  SecurityRule,
  SecurityCheckResult,
  Violation,
  ViolationSeverity,
  ViolationAction,
  PIIAction,
  LengthAction,
  Guardrails,
  GuardrailsConfig,
  InputFilter,
  OutputFilter,
  TextAdapter,
  SecurityRuleConfig,
  RuleBasedSecurityRuleConfig,
  LLMSecurityRuleConfig,
} from './types';

// Guardrails
export { createGuardrails } from './guardrails';

// Filters
export { createInputFilter, createOutputFilter, type FilterConfig } from './filters';

// Rules
export {
  promptInjectionRule,
  piiDetectionRule,
  toxicityRule,
  topicBlockRule,
  lengthLimitRule,
  createSecurityRule,
  type PromptInjectionRuleConfig,
  type PIIDetectionRuleConfig,
  type ToxicityRuleConfig,
  type TopicBlockRuleConfig,
  type LengthLimitRuleConfig,
} from './rules';

// Middleware
export {
  securityMiddleware,
  type SecurityMiddlewareConfig,
  type SecurityMiddlewareFn,
  type InputViolationResult,
  type OutputViolationResult,
  type MiddlewareResult,
} from './middleware';

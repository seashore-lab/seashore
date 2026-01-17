/**
 * @seashore/tool - Calculator Tool
 *
 * Preset tool for mathematical calculations
 */

import { z } from 'zod';
import { defineTool } from '../define-tool';

/**
 * Calculator operation result
 */
export interface CalculatorResult {
  readonly operation: string;
  readonly result: number;
  readonly expression?: string;
}

/**
 * Input schema for basic calculation
 */
const calculateInputSchema = z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
  operation: z
    .enum(['add', 'subtract', 'multiply', 'divide'])
    .describe('Mathematical operation to perform'),
});

/**
 * Input schema for power calculation
 */
const powerInputSchema = z.object({
  base: z.number().describe('Base number'),
  exponent: z.number().describe('Exponent'),
});

/**
 * Input schema for factorial
 */
const factorialInputSchema = z.object({
  n: z.number().int().min(0).max(170).describe('Non-negative integer for factorial calculation'),
});

/**
 * Input schema for square root
 */
const sqrtInputSchema = z.object({
  n: z.number().min(0).describe('Non-negative number for square root'),
});

/**
 * Input schema for prime check
 */
const primeInputSchema = z.object({
  n: z.number().int().min(2).describe('Integer to check for primality'),
});

/**
 * Input schema for expression evaluation
 */
const expressionInputSchema = z.object({
  expression: z
    .string()
    .describe(
      'Mathematical expression to evaluate (supports +, -, *, /, ^, sqrt, sin, cos, tan, log, abs, floor, ceil, round, pi, e)'
    ),
});

/**
 * Create a basic calculator tool for arithmetic operations
 *
 * @example
 * ```typescript
 * import { calculatorTool } from '@seashore/tool/presets';
 *
 * const calc = calculatorTool();
 * const result = await calc.execute({ a: 10, b: 5, operation: 'add' });
 * // result: { operation: 'addition', result: 15 }
 * ```
 */
export function calculatorTool() {
  return defineTool({
    name: 'calculator',
    description:
      'Perform basic arithmetic operations (add, subtract, multiply, divide) on two numbers.',
    inputSchema: calculateInputSchema,

    async execute({ a, b, operation }) {
      let result: number;
      let operationName: string;

      switch (operation) {
        case 'add':
          result = a + b;
          operationName = 'addition';
          break;
        case 'subtract':
          result = a - b;
          operationName = 'subtraction';
          break;
        case 'multiply':
          result = a * b;
          operationName = 'multiplication';
          break;
        case 'divide':
          if (b === 0) {
            throw new Error('Division by zero is undefined');
          }
          result = a / b;
          operationName = 'division';
          break;
      }

      return {
        operation: operationName,
        result,
        expression: `${a} ${getOperatorSymbol(operation)} ${b} = ${result}`,
      };
    },
  });
}

/**
 * Create a power/exponentiation tool
 *
 * @example
 * ```typescript
 * import { powerTool } from '@seashore/tool/presets';
 *
 * const power = powerTool();
 * const result = await power.execute({ base: 2, exponent: 3 });
 * // result: { operation: 'exponentiation', result: 8 }
 * ```
 */
export function powerTool() {
  return defineTool({
    name: 'power',
    description: 'Calculate the power of a number (base raised to exponent).',
    inputSchema: powerInputSchema,

    async execute({ base, exponent }) {
      const result = Math.pow(base, exponent);

      return {
        operation: 'exponentiation',
        result,
        expression: `${base}^${exponent} = ${result}`,
      };
    },
  });
}

/**
 * Create a factorial tool
 *
 * @example
 * ```typescript
 * import { factorialTool } from '@seashore/tool/presets';
 *
 * const factorial = factorialTool();
 * const result = await factorial.execute({ n: 5 });
 * // result: { operation: 'factorial', result: 120 }
 * ```
 */
export function factorialTool() {
  return defineTool({
    name: 'factorial',
    description: 'Calculate the factorial of a non-negative integer (n!).',
    inputSchema: factorialInputSchema,

    async execute({ n }) {
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }

      return {
        operation: 'factorial',
        result,
        expression: `${n}! = ${result}`,
      };
    },
  });
}

/**
 * Create a square root tool
 *
 * @example
 * ```typescript
 * import { sqrtTool } from '@seashore/tool/presets';
 *
 * const sqrt = sqrtTool();
 * const result = await sqrt.execute({ n: 16 });
 * // result: { operation: 'square_root', result: 4 }
 * ```
 */
export function sqrtTool() {
  return defineTool({
    name: 'sqrt',
    description: 'Calculate the square root of a non-negative number.',
    inputSchema: sqrtInputSchema,

    async execute({ n }) {
      const result = Math.sqrt(n);

      return {
        operation: 'square_root',
        result,
        expression: `√${n} = ${result}`,
      };
    },
  });
}

/**
 * Create a prime check tool
 *
 * @example
 * ```typescript
 * import { isPrimeTool } from '@seashore/tool/presets';
 *
 * const isPrime = isPrimeTool();
 * const result = await isPrime.execute({ n: 17 });
 * // result: { operation: 'prime_check', result: true, expression: '17 is prime' }
 * ```
 */
export function isPrimeTool() {
  return defineTool({
    name: 'is_prime',
    description: 'Check if a number is prime.',
    inputSchema: primeInputSchema,

    async execute({ n }) {
      const isPrime = checkPrime(n);

      return {
        operation: 'prime_check',
        result: isPrime ? 1 : 0,
        expression: `${n} is ${isPrime ? 'prime' : 'not prime'}`,
      };
    },
  });
}

/**
 * Create a mathematical expression evaluator tool
 *
 * @example
 * ```typescript
 * import { expressionTool } from '@seashore/tool/presets';
 *
 * const expr = expressionTool();
 * const result = await expr.execute({ expression: 'sqrt(16) + 2^3' });
 * // result: { operation: 'expression', result: 12 }
 * ```
 */
export function expressionTool() {
  return defineTool({
    name: 'evaluate_expression',
    description:
      'Evaluate a mathematical expression. Supports: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), abs(), floor(), ceil(), round(), pi, e',
    inputSchema: expressionInputSchema,

    async execute({ expression }) {
      const result = evaluateExpression(expression);

      return {
        operation: 'expression',
        result,
        expression: `${expression} = ${result}`,
      };
    },
  });
}

/**
 * Get operator symbol for display
 */
function getOperatorSymbol(operation: 'add' | 'subtract' | 'multiply' | 'divide'): string {
  switch (operation) {
    case 'add':
      return '+';
    case 'subtract':
      return '-';
    case 'multiply':
      return '×';
    case 'divide':
      return '÷';
  }
}

/**
 * Check if a number is prime
 */
function checkPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;

  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Safely evaluate a mathematical expression
 */
function evaluateExpression(expression: string): number {
  // Sanitize and prepare the expression
  let sanitized = expression
    .replace(/\s+/g, '') // Remove whitespace
    .replace(/\^/g, '**') // Convert ^ to **
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/sin\(/gi, 'Math.sin(')
    .replace(/cos\(/gi, 'Math.cos(')
    .replace(/tan\(/gi, 'Math.tan(')
    .replace(/log\(/gi, 'Math.log(')
    .replace(/abs\(/gi, 'Math.abs(')
    .replace(/floor\(/gi, 'Math.floor(')
    .replace(/ceil\(/gi, 'Math.ceil(')
    .replace(/round\(/gi, 'Math.round(')
    .replace(/\bpi\b/gi, String(Math.PI))
    .replace(/\be\b/gi, String(Math.E));

  // Validate: only allow safe characters
  if (!/^[0-9+\-*/().Math,\s]+$/.test(sanitized)) {
    throw new Error('Invalid characters in expression');
  }

  // Evaluate using Function constructor (safer than eval but still restricted)
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(`return ${sanitized}`);
    const result = fn();

    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Expression did not evaluate to a valid number');
    }

    return result;
  } catch {
    throw new Error(`Failed to evaluate expression: ${expression}`);
  }
}

/**
 * @seashorelab/tool - Shell Tool
 *
 * Preset tool for executing shell commands
 */

import { z } from 'zod';
import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import { defineTool } from '../define-tool';

const execAsync = promisify(exec);

/**
 * Configuration for Shell tool
 */
export interface ShellToolConfig {
  /** Working directory for command execution */
  readonly cwd?: string;
  /** Timeout in milliseconds (default: 30000) */
  readonly timeout?: number;
  /** Maximum output buffer size in bytes (default: 10MB) */
  readonly maxBuffer?: number;
  /** Environment variables to set */
  readonly env?: Record<string, string>;
  /** List of allowed commands (if set, only these commands can be run) */
  readonly allowedCommands?: string[];
  /** List of blocked commands (these commands will be rejected) */
  readonly blockedCommands?: string[];
  /** Whether to allow potentially dangerous commands (default: false) */
  readonly allowDangerous?: boolean;
}

/**
 * Shell command result
 */
export interface ShellResult {
  readonly command: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
  readonly executionTime: number;
}

/**
 * Default dangerous commands that are blocked
 */
const DANGEROUS_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'mkfs',
  'dd if=/dev/zero',
  'dd if=/dev/random',
  ':(){:|:&};:',
  'chmod -R 777 /',
  'chown -R',
  'shutdown',
  'reboot',
  'halt',
  'poweroff',
  'init 0',
  'init 6',
];

/**
 * Input schema for shell command execution
 */
const shellInputSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  cwd: z.string().optional().describe('Working directory for command execution'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  env: z.record(z.string(), z.string()).optional().describe('Additional environment variables'),
});

/**
 * Check if a command is dangerous
 */
function isDangerousCommand(command: string): boolean {
  const normalizedCommand = command.toLowerCase().trim();

  for (const dangerous of DANGEROUS_COMMANDS) {
    if (normalizedCommand.includes(dangerous.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a command is in the allowed list
 */
function isCommandAllowed(command: string, allowedCommands?: string[]): boolean {
  if (!allowedCommands || allowedCommands.length === 0) {
    return true;
  }

  const commandName = command.trim().split(/\s+/)[0] ?? '';

  return allowedCommands.some(
    (allowed) =>
      commandName === allowed ||
      commandName.endsWith(`/${allowed}`) ||
      command.trim().startsWith(allowed)
  );
}

/**
 * Check if a command is blocked
 */
function isCommandBlocked(command: string, blockedCommands?: string[]): boolean {
  if (!blockedCommands || blockedCommands.length === 0) {
    return false;
  }

  const commandName = command.trim().split(/\s+/)[0] ?? '';

  return blockedCommands.some(
    (blocked) =>
      commandName === blocked ||
      commandName.endsWith(`/${blocked}`) ||
      command.trim().startsWith(blocked)
  );
}

/**
 * Create a shell command execution tool
 *
 * @example
 * ```typescript
 * import { shellTool } from '@seashorelab/tool/presets';
 *
 * // Basic usage
 * const shell = shellTool();
 * const result = await shell.execute({ command: 'ls -la' });
 *
 * // With restrictions
 * const safeShell = shellTool({
 *   allowedCommands: ['ls', 'cat', 'grep', 'find'],
 *   timeout: 10000
 * });
 * ```
 */
export function shellTool(config: ShellToolConfig = {}) {
  const defaultTimeout = config.timeout ?? 30000;
  const defaultMaxBuffer = config.maxBuffer ?? 10 * 1024 * 1024; // 10MB

  return defineTool({
    name: 'shell',
    description:
      'Execute a shell command and return the output. Use with caution as this can execute arbitrary commands.',
    inputSchema: shellInputSchema,

    async execute({ command, cwd, timeout, env }) {
      // Security checks
      if (!config.allowDangerous && isDangerousCommand(command)) {
        throw new Error(
          `Command rejected: "${command}" is considered dangerous and has been blocked for safety.`
        );
      }

      if (!isCommandAllowed(command, config.allowedCommands)) {
        throw new Error(`Command rejected: "${command}" is not in the list of allowed commands.`);
      }

      if (isCommandBlocked(command, config.blockedCommands)) {
        throw new Error(`Command rejected: "${command}" is in the list of blocked commands.`);
      }

      const startTime = Date.now();

      const execOptions: ExecOptions = {
        cwd: cwd ?? config.cwd,
        timeout: timeout ?? defaultTimeout,
        maxBuffer: defaultMaxBuffer,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ...config.env,
          ...env,
        } as NodeJS.ProcessEnv,
      };

      try {
        const { stdout, stderr } = await execAsync(command, execOptions);

        return {
          command,
          stdout: String(stdout).trim(),
          stderr: String(stderr).trim(),
          exitCode: 0,
          executionTime: Date.now() - startTime,
        } as ShellResult;
      } catch (error) {
        const execError = error as {
          stdout?: string;
          stderr?: string;
          code?: number;
          killed?: boolean;
          signal?: string;
        };

        // Handle timeout
        if (execError.killed && execError.signal === 'SIGTERM') {
          throw new Error(`Command timed out after ${timeout ?? defaultTimeout}ms: "${command}"`);
        }

        // Return result with non-zero exit code
        return {
          command,
          stdout: execError.stdout?.trim() ?? '',
          stderr: execError.stderr?.trim() ?? '',
          exitCode: execError.code ?? 1,
          executionTime: Date.now() - startTime,
        } as ShellResult;
      }
    },
  });
}

/**
 * Create a restricted shell tool that only allows specific commands
 *
 * @example
 * ```typescript
 * import { restrictedShellTool } from '@seashorelab/tool/presets';
 *
 * const shell = restrictedShellTool({
 *   allowedCommands: ['git', 'npm', 'node'],
 *   cwd: '/path/to/project'
 * });
 * ```
 */
export function restrictedShellTool(config: ShellToolConfig & { allowedCommands: string[] }) {
  return shellTool(config);
}

/**
 * Input schema for running a script file
 */
const runScriptInputSchema = z.object({
  scriptPath: z.string().describe('Path to the script file to execute'),
  args: z.array(z.string()).optional().describe('Arguments to pass to the script'),
  interpreter: z
    .string()
    .optional()
    .describe('Interpreter to use (e.g., "bash", "python", "node")'),
});

/**
 * Create a script execution tool
 *
 * @example
 * ```typescript
 * import { runScriptTool } from '@seashorelab/tool/presets';
 *
 * const runScript = runScriptTool({ cwd: '/path/to/scripts' });
 * const result = await runScript.execute({
 *   scriptPath: './my-script.sh',
 *   args: ['arg1', 'arg2']
 * });
 * ```
 */
export function runScriptTool(config: ShellToolConfig = {}) {
  const defaultTimeout = config.timeout ?? 60000; // 1 minute for scripts
  const defaultMaxBuffer = config.maxBuffer ?? 10 * 1024 * 1024;

  return defineTool({
    name: 'run_script',
    description: 'Execute a script file with optional arguments.',
    inputSchema: runScriptInputSchema,

    async execute({ scriptPath, args = [], interpreter }) {
      // Build command
      let command: string;
      if (interpreter) {
        command = `${interpreter} ${scriptPath} ${args.join(' ')}`;
      } else {
        command = `${scriptPath} ${args.join(' ')}`;
      }

      const startTime = Date.now();

      const execOptions: ExecOptions = {
        cwd: config.cwd,
        timeout: defaultTimeout,
        maxBuffer: defaultMaxBuffer,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ...config.env,
        } as NodeJS.ProcessEnv,
      };

      try {
        const { stdout, stderr } = await execAsync(command.trim(), execOptions);

        return {
          command: command.trim(),
          stdout: String(stdout).trim(),
          stderr: String(stderr).trim(),
          exitCode: 0,
          executionTime: Date.now() - startTime,
        } as ShellResult;
      } catch (error) {
        const execError = error as {
          stdout?: string;
          stderr?: string;
          code?: number;
          killed?: boolean;
          signal?: string;
        };

        if (execError.killed && execError.signal === 'SIGTERM') {
          throw new Error(`Script timed out after ${defaultTimeout}ms: "${scriptPath}"`);
        }

        return {
          command: command.trim(),
          stdout: execError.stdout?.trim() ?? '',
          stderr: execError.stderr?.trim() ?? '',
          exitCode: execError.code ?? 1,
          executionTime: Date.now() - startTime,
        } as ShellResult;
      }
    },
  });
}

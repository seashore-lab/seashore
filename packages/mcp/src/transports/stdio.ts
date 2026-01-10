/**
 * Stdio transport for MCP
 * Communicates with MCP server via subprocess stdin/stdout
 * @module @seashore/mcp
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import type { MCPClientConfig } from '../types';

/**
 * JSON-RPC request/response types
 */
interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

/**
 * Pending request handler
 */
interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Stdio transport class
 */
export class StdioTransport {
  private process: ChildProcess | null = null;
  private readline: ReadlineInterface | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, PendingRequest>();
  private notificationHandlers = new Map<string, (params: unknown) => void>();
  private connected = false;
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    if (!config.command) {
      throw new Error('StdioTransport requires a command');
    }
    this.config = config;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      const { command, args = [], cwd, env } = this.config;

      this.process = spawn(command!, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32', // Use shell on Windows for .cmd scripts
      });

      // Handle process errors
      this.process.on('error', (error) => {
        this.connected = false;
        reject(new MCPConnectionError(`Failed to start process: ${error.message}`));
      });

      this.process.on('exit', (code, signal) => {
        this.connected = false;
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
          clearTimeout(pending.timeout);
          pending.reject(
            new MCPConnectionError(`Process exited with code ${code}, signal ${signal}`)
          );
          this.pendingRequests.delete(id);
        }
      });

      // Setup readline for stdout
      if (this.process.stdout) {
        this.readline = createInterface({
          input: this.process.stdout,
          crlfDelay: Infinity,
        });

        this.readline.on('line', (line) => {
          this.handleMessage(line);
        });
      }

      // Log stderr
      if (this.process.stderr) {
        this.process.stderr.on('data', (data) => {
          // eslint-disable-next-line no-console
          console.error('[MCP stderr]:', data.toString());
        });
      }

      // Wait for process to be ready before initializing
      // Use spawn event on Windows or nextTick on other platforms
      const startInitialize = () => {
        // Small delay to ensure stdio pipes are ready
        setTimeout(() => {
          this.initialize()
            .then(() => {
              this.connected = true;
              resolve();
            })
            .catch(reject);
        }, 100);
      };

      if (this.process.pid) {
        startInitialize();
      } else {
        this.process.once('spawn', startInitialize);
      }
    });
  }

  /**
   * Initialize MCP protocol handshake
   */
  private async initialize(): Promise<void> {
    const result = await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
      },
      clientInfo: {
        name: '@seashore/mcp',
        version: '0.1.0',
      },
    });

    // Send initialized notification
    this.notify('notifications/initialized', {});

    return result as void;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(line: string): void {
    try {
      const message = JSON.parse(line) as JSONRPCMessage;

      // Check if it's a request from server (has id and method)
      if ('id' in message && 'method' in message && message.id !== undefined) {
        // This is a request from the server to the client
        const request = message as JSONRPCRequest;
        this.handleServerRequest(request);
        return;
      }

      // Handle response from server
      if ('id' in message && !('method' in message) && message.id !== undefined) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.id);

          const response = message as JSONRPCResponse;
          if ('error' in response && response.error) {
            pending.reject(new MCPError(response.error.code, response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
        return;
      }

      // Handle notification from server
      if ('method' in message && !('id' in message)) {
        const notification = message as JSONRPCNotification;
        const handler = this.notificationHandlers.get(notification.method);
        if (handler) {
          handler(notification.params);
        }
      }
    } catch {
      // Ignore parse errors for non-JSON lines
    }
  }

  /**
   * Handle requests from server to client
   */
  private handleServerRequest(request: JSONRPCRequest): void {
    // Handle known server-to-client requests
    if (request.method === 'roots/list') {
      // Respond with empty roots list
      this.sendResponse(request.id, { roots: [] });
    } else {
      // Send error for unknown methods
      this.sendError(request.id, -32601, `Method not found: ${request.method}`);
    }
  }

  /**
   * Send a JSON-RPC response
   */
  private sendResponse(id: number, result: unknown): void {
    const response: JSONRPCResponse = {
      jsonrpc: '2.0',
      id,
      result,
    };

    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(response) + '\n');
    }
  }

  /**
   * Send a JSON-RPC error response
   */
  private sendError(id: number, code: number, message: string): void {
    const response: JSONRPCResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
      },
    };

    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(response) + '\n');
    }
  }

  /**
   * Send a JSON-RPC request
   */
  async request(method: string, params?: unknown): Promise<unknown> {
    if (!this.connected && method !== 'initialize') {
      throw new MCPConnectionError('Not connected to MCP server');
    }

    const id = ++this.requestId;
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new MCPTimeoutError(`Request timed out: ${method}`));
      }, this.config.timeout ?? 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      if (this.process?.stdin?.writable) {
        this.process.stdin.write(JSON.stringify(request) + '\n');
      } else {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(new MCPConnectionError('Process stdin not writable'));
      }
    });
  }

  /**
   * Send a notification (no response expected)
   */
  notify(method: string, params?: unknown): void {
    const notification: JSONRPCNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(notification) + '\n');
    }
  }

  /**
   * Register a notification handler
   */
  onNotification(method: string, handler: (params: unknown) => void): void {
    this.notificationHandlers.set(method, handler);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect (stop listening, keep process running)
   */
  async disconnect(): Promise<void> {
    this.connected = false;
    this.readline?.close();
    this.readline = null;
  }

  /**
   * Reconnect to the server
   */
  async reconnect(): Promise<void> {
    await this.close();
    await this.connect();
  }

  /**
   * Close the transport (terminate process)
   */
  async close(): Promise<void> {
    this.connected = false;

    // Clear pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new MCPConnectionError('Transport closed'));
      this.pendingRequests.delete(id);
    }

    this.readline?.close();
    this.readline = null;

    if (this.process) {
      // Close stdin to signal graceful shutdown
      this.process.stdin?.end();

      // Wait a bit for graceful shutdown, then force kill if needed
      const killTimeout = setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }, 1000);

      // Clean up on process exit
      this.process.once('exit', () => {
        clearTimeout(killTimeout);
      });

      // Try graceful shutdown first
      if (!this.process.killed) {
        this.process.kill('SIGTERM');
      }

      // Wait a short time for process to exit
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.process || this.process.killed || this.process.exitCode !== null) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);

        // Max wait 1.5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 1500);
      });

      this.process = null;
    }
  }
}

/**
 * MCP Error base class
 */
export class MCPError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
  }
}

/**
 * MCP Connection Error
 */
export class MCPConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPConnectionError';
  }
}

/**
 * MCP Timeout Error
 */
export class MCPTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPTimeoutError';
  }
}

/**
 * Create a stdio transport
 */
export function createStdioTransport(config: MCPClientConfig): StdioTransport {
  return new StdioTransport(config);
}

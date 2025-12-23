/**
 * @seashore/mcp - Model Context Protocol 接口契约
 *
 * 实现 MCP 客户端，支持连接外部 MCP 服务器
 * 支持 stdio 和 HTTP/SSE 传输协议
 */

// ============================================================================
// Transport Types
// ============================================================================

/**
 * 传输类型
 */
export type TransportType = 'stdio' | 'sse'

/**
 * Stdio 传输配置
 */
export interface StdioTransportConfig {
  type: 'stdio'
  command: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
}

/**
 * SSE 传输配置
 */
export interface SSETransportConfig {
  type: 'sse'
  url: string
  headers?: Record<string, string>
}

/**
 * 传输配置联合类型
 */
export type TransportConfig = StdioTransportConfig | SSETransportConfig

// ============================================================================
// MCP Server Definition
// ============================================================================

/**
 * MCP 服务器定义
 */
export interface MCPServerDefinition {
  /**
   * 服务器 ID
   */
  id: string

  /**
   * 服务器名称
   */
  name: string

  /**
   * 传输配置
   */
  transport: TransportConfig

  /**
   * 超时设置 (毫秒)
   */
  timeout?: number

  /**
   * 重连配置
   */
  reconnect?: {
    enabled: boolean
    maxRetries?: number
    delay?: number
  }
}

// ============================================================================
// MCP Resources
// ============================================================================

/**
 * MCP 资源
 */
export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

/**
 * MCP 资源内容
 */
export interface MCPResourceContent {
  uri: string
  mimeType: string
  text?: string
  blob?: Uint8Array
}

/**
 * 资源模板
 */
export interface MCPResourceTemplate {
  uriTemplate: string
  name: string
  description?: string
  mimeType?: string
}

// ============================================================================
// MCP Tools
// ============================================================================

/**
 * MCP 工具定义
 */
export interface MCPToolDefinition {
  name: string
  description?: string
  inputSchema: unknown // JSON Schema
}

/**
 * MCP 工具调用结果
 */
export interface MCPToolResult {
  content: MCPContent[]
  isError?: boolean
}

/**
 * MCP 内容
 */
export type MCPContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; resource: MCPResourceContent }

// ============================================================================
// MCP Prompts
// ============================================================================

/**
 * MCP 提示词
 */
export interface MCPPrompt {
  name: string
  description?: string
  arguments?: MCPPromptArgument[]
}

/**
 * 提示词参数
 */
export interface MCPPromptArgument {
  name: string
  description?: string
  required?: boolean
}

/**
 * 提示词消息
 */
export interface MCPPromptMessage {
  role: 'user' | 'assistant'
  content: MCPContent
}

// ============================================================================
// MCP Client Interface
// ============================================================================

/**
 * MCP 客户端配置
 */
export interface MCPClientConfig {
  /**
   * 服务器定义
   */
  servers: MCPServerDefinition[]

  /**
   * 默认超时 (毫秒)
   */
  defaultTimeout?: number

  /**
   * 日志级别
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * MCP 客户端接口
 */
export interface MCPClient {
  /**
   * 连接到服务器
   */
  connect(serverId: string): Promise<void>

  /**
   * 断开服务器连接
   */
  disconnect(serverId: string): Promise<void>

  /**
   * 检查服务器连接状态
   */
  isConnected(serverId: string): boolean

  /**
   * 获取服务器能力
   */
  getCapabilities(serverId: string): Promise<MCPServerCapabilities>

  // --- Resources ---

  /**
   * 列出服务器资源
   */
  listResources(serverId: string): Promise<MCPResource[]>

  /**
   * 列出资源模板
   */
  listResourceTemplates(serverId: string): Promise<MCPResourceTemplate[]>

  /**
   * 读取资源
   */
  readResource(serverId: string, uri: string): Promise<MCPResourceContent>

  /**
   * 订阅资源更新
   */
  subscribeResource(
    serverId: string,
    uri: string,
    callback: (content: MCPResourceContent) => void
  ): () => void

  // --- Tools ---

  /**
   * 列出服务器工具
   */
  listTools(serverId: string): Promise<MCPToolDefinition[]>

  /**
   * 调用工具
   */
  callTool(
    serverId: string,
    name: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult>

  // --- Prompts ---

  /**
   * 列出提示词
   */
  listPrompts(serverId: string): Promise<MCPPrompt[]>

  /**
   * 获取提示词
   */
  getPrompt(
    serverId: string,
    name: string,
    args?: Record<string, string>
  ): Promise<MCPPromptMessage[]>

  // --- Lifecycle ---

  /**
   * 连接所有服务器
   */
  connectAll(): Promise<void>

  /**
   * 断开所有服务器
   */
  disconnectAll(): Promise<void>

  /**
   * 获取所有已连接服务器
   */
  getConnectedServers(): string[]
}

/**
 * 服务器能力
 */
export interface MCPServerCapabilities {
  resources?: {
    subscribe?: boolean
    listChanged?: boolean
  }
  tools?: {
    listChanged?: boolean
  }
  prompts?: {
    listChanged?: boolean
  }
  logging?: boolean
}

// ============================================================================
// MCP Tools Bridge
// ============================================================================

/**
 * 将 MCP 工具转换为 Seashore Tool
 */
export interface MCPToolsBridge {
  /**
   * 获取所有 MCP 工具作为 Seashore 工具
   */
  getTools(): Promise<unknown[]> // ServerTool[]

  /**
   * 获取特定服务器的工具
   */
  getToolsFromServer(serverId: string): Promise<unknown[]>

  /**
   * 刷新工具列表
   */
  refresh(): Promise<void>
}

/**
 * 创建 MCP 工具桥接器
 *
 * @example
 * ```typescript
 * import { createMCPToolsBridge } from "@seashore/mcp";
 *
 * const bridge = createMCPToolsBridge(mcpClient);
 *
 * // 获取所有 MCP 工具
 * const tools = await bridge.getTools();
 *
 * // 用于 Agent
 * const agent = createReActAgent({
 *   llm,
 *   tools: [...localTools, ...tools],
 * });
 * ```
 */
export function createMCPToolsBridge(client: MCPClient): MCPToolsBridge

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * 创建 MCP 客户端
 *
 * @example
 * ```typescript
 * import { createMCPClient } from "@seashore/mcp";
 *
 * const client = await createMCPClient({
 *   servers: [
 *     {
 *       id: "filesystem",
 *       name: "Filesystem Server",
 *       transport: {
 *         type: "stdio",
 *         command: "npx",
 *         args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
 *       },
 *     },
 *     {
 *       id: "web",
 *       name: "Web Server",
 *       transport: {
 *         type: "sse",
 *         url: "http://localhost:3001/sse",
 *       },
 *     },
 *   ],
 * });
 *
 * // 连接所有服务器
 * await client.connectAll();
 *
 * // 列出工具
 * const tools = await client.listTools("filesystem");
 *
 * // 调用工具
 * const result = await client.callTool("filesystem", "read_file", {
 *   path: "/path/to/file.txt",
 * });
 *
 * // 读取资源
 * const content = await client.readResource("filesystem", "file:///path/to/file.txt");
 * ```
 */
export function createMCPClient(config: MCPClientConfig): Promise<MCPClient>

// ============================================================================
// MCP Server Builder (for creating MCP servers)
// ============================================================================

/**
 * MCP 服务器构建器配置
 */
export interface MCPServerBuilderConfig {
  name: string
  version: string
  description?: string
}

/**
 * MCP 服务器构建器
 */
export interface MCPServerBuilder {
  /**
   * 添加资源
   */
  addResource(
    uri: string,
    config: {
      name: string
      description?: string
      mimeType?: string
      handler: () => Promise<string | Uint8Array>
    }
  ): MCPServerBuilder

  /**
   * 添加资源模板
   */
  addResourceTemplate(
    uriTemplate: string,
    config: {
      name: string
      description?: string
      mimeType?: string
      handler: (params: Record<string, string>) => Promise<string | Uint8Array>
    }
  ): MCPServerBuilder

  /**
   * 添加工具
   */
  addTool<T extends Record<string, unknown>>(
    name: string,
    config: {
      description?: string
      inputSchema: unknown
      handler: (args: T) => Promise<MCPContent[]>
    }
  ): MCPServerBuilder

  /**
   * 添加提示词
   */
  addPrompt(
    name: string,
    config: {
      description?: string
      arguments?: MCPPromptArgument[]
      handler: (args: Record<string, string>) => Promise<MCPPromptMessage[]>
    }
  ): MCPServerBuilder

  /**
   * 构建并启动 stdio 服务器
   */
  serveStdio(): Promise<void>

  /**
   * 构建并返回 Hono 路由 (SSE)
   */
  buildHonoRoutes(): unknown // Hono app
}

/**
 * 创建 MCP 服务器构建器
 *
 * @example
 * ```typescript
 * import { defineMCPServer } from "@seashore/mcp";
 *
 * const server = defineMCPServer({
 *   name: "my-server",
 *   version: "1.0.0",
 * })
 *   .addTool("hello", {
 *     description: "Say hello",
 *     inputSchema: z.object({ name: z.string() }),
 *     handler: async ({ name }) => [{ type: "text", text: `Hello, ${name}!` }],
 *   })
 *   .addResource("file:///readme", {
 *     name: "README",
 *     handler: async () => "# My Server",
 *   });
 *
 * // 启动 stdio 服务器
 * await server.serveStdio();
 * ```
 */
export function defineMCPServer(config: MCPServerBuilderConfig): MCPServerBuilder

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServerConfig } from "../src/types.js";

// Mock the MCP SDK imports
vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@modelcontextprotocol/sdk/client/sse.js", () => ({
  SSEClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@modelcontextprotocol/sdk/client/websocket.js", () => ({
  WebSocketClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
    listResources: vi.fn().mockResolvedValue({ resources: [] }),
    callTool: vi.fn().mockResolvedValue({ isError: false, content: [] }),
    readResource: vi.fn().mockResolvedValue({ contents: [] }),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock other dependencies
vi.mock("../src/util.js", () => ({
  logVerbose: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("../src/cancellation.js", () => ({
  toSignal: vi.fn(() => new AbortController().signal),
}));

vi.mock("../src/cleaners.js", () => ({
  arrayify: vi.fn((x) => (Array.isArray(x) ? x : x ? [x] : [])),
  deleteUndefinedValues: vi.fn((x) => x),
}));

vi.mock("../src/filecache.js", () => ({
  fileWriteCachedJSON: vi.fn().mockResolvedValue("/tmp/test.json"),
}));

vi.mock("../src/workdir.js", () => ({
  dotGenaiscriptPath: vi.fn((...args) => args.join("/")),
}));

vi.mock("../src/yaml.js", () => ({
  YAMLStringify: vi.fn((x) => JSON.stringify(x)),
}));

vi.mock("../src/debug.js", () => ({
  genaiscriptDebug: vi.fn(() => ({
    extend: vi.fn(() => vi.fn()),
  })),
}));

vi.mock("../src/crypto.js", () => ({
  hash: vi.fn(() => "test-hash"),
}));

vi.mock("../src/contentsafety.js", () => ({
  resolvePromptInjectionDetector: vi.fn(),
}));

vi.mock("../src/error.js", () => ({
  errorMessage: vi.fn((e) => e?.message || String(e)),
}));

describe("MCP Transport Support", () => {
  let McpClientManager: any;
  let StdioClientTransport: any;
  let StreamableHTTPClientTransport: any;
  let SSEClientTransport: any;
  let WebSocketClientTransport: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the mocked modules
    const stdioModule = await import("@modelcontextprotocol/sdk/client/stdio.js");
    StdioClientTransport = stdioModule.StdioClientTransport;

    const httpModule = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
    StreamableHTTPClientTransport = httpModule.StreamableHTTPClientTransport;

    const sseModule = await import("@modelcontextprotocol/sdk/client/sse.js");
    SSEClientTransport = sseModule.SSEClientTransport;

    const wsModule = await import("@modelcontextprotocol/sdk/client/websocket.js");
    WebSocketClientTransport = wsModule.WebSocketClientTransport;

    // Import the actual implementation
    const clientModule = await import("../src/mcpclient.js");
    McpClientManager = clientModule.McpClientManager;
  });

  it("should create stdio transport for traditional command/args config", async () => {
    const config: McpServerConfig = {
      id: "test-stdio",
      command: "node",
      args: ["./server.js"],
      type: "stdio",
    };

    const manager = new McpClientManager();

    // Mock the trace object
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations, but we can verify transport creation
    }

    expect(StdioClientTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "node",
        args: ["./server.js"],
      }),
    );
  });

  it("should create HTTP transport for URL config", async () => {
    const config: McpServerConfig = {
      id: "test-http",
      url: "https://example.com/mcp",
      type: "http",
    };

    const manager = new McpClientManager();
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations
    }

    expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(expect.any(URL));
  });

  it("should create SSE transport for SSE config", async () => {
    const config: McpServerConfig = {
      id: "test-sse",
      url: "https://example.com/sse",
      type: "sse",
    };

    const manager = new McpClientManager();
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations
    }

    expect(SSEClientTransport).toHaveBeenCalledWith(expect.any(URL));
  });

  it("should create WebSocket transport for WebSocket config", async () => {
    const config: McpServerConfig = {
      id: "test-ws",
      url: "wss://example.com/ws",
      type: "websocket",
    };

    const manager = new McpClientManager();
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations
    }

    expect(WebSocketClientTransport).toHaveBeenCalledWith(expect.any(URL));
  });

  it("should auto-detect WebSocket transport from ws:// URL", async () => {
    const config: McpServerConfig = {
      id: "test-ws-auto",
      url: "ws://localhost:3000",
      // type not specified, should auto-detect
    };

    const manager = new McpClientManager();
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations
    }

    expect(WebSocketClientTransport).toHaveBeenCalledWith(expect.any(URL));
  });

  it("should auto-detect HTTP transport from https:// URL", async () => {
    const config: McpServerConfig = {
      id: "test-http-auto",
      url: "https://api.example.com/mcp",
      // type not specified, should auto-detect to HTTP
    };

    const manager = new McpClientManager();
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations
    }

    expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(expect.any(URL));
  });

  it("should maintain backward compatibility with legacy stdio configs", async () => {
    const config: McpServerConfig = {
      id: "test-legacy",
      command: "python",
      args: ["-m", "server"],
      // no type specified, should default to stdio
    };

    const manager = new McpClientManager();
    const mockTrace = {
      startTraceDetails: vi.fn(() => ({
        fence: vi.fn(),
        appendContent: vi.fn(),
      })),
    };

    try {
      await manager.startMcpServer(config, {
        trace: mockTrace,
        cancellationToken: undefined,
      });
    } catch (e) {
      // Expected to fail due to mocking limitations
    }

    expect(StdioClientTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "python",
        args: ["-m", "server"],
      }),
    );
  });
});

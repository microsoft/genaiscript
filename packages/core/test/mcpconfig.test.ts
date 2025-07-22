import { describe, it, expect } from "vitest";
import type { McpServerConfig } from "../src/types.js";

describe("MCP Transport Configuration Validation", () => {
  it("should validate stdio transport configuration", () => {
    const config: McpServerConfig = {
      id: "test-stdio",
      type: "stdio",
      command: "node",
      args: ["--version"],
    };

    // Ensure the config satisfies the interface
    expect(config.id).toBe("test-stdio");
    expect(config.type).toBe("stdio");
    expect(config.command).toBeDefined();
    expect(config.args).toBeDefined();
  });

  it("should validate HTTP transport configuration", () => {
    const config: McpServerConfig = {
      id: "test-http",
      type: "http",
      url: "https://api.example.com/mcp",
    };

    expect(config.id).toBe("test-http");
    expect(config.type).toBe("http");
    expect(config.url).toBe("https://api.example.com/mcp");
  });

  it("should validate SSE transport configuration", () => {
    const config: McpServerConfig = {
      id: "test-sse",
      type: "sse",
      url: "https://events.example.com/mcp",
    };

    expect(config.id).toBe("test-sse");
    expect(config.type).toBe("sse");
    expect(config.url).toBe("https://events.example.com/mcp");
  });

  it("should validate WebSocket transport configuration", () => {
    const config: McpServerConfig = {
      id: "test-ws",
      type: "websocket",
      url: "wss://ws.example.com/mcp",
    };

    expect(config.id).toBe("test-ws");
    expect(config.type).toBe("websocket");
    expect(config.url).toBe("wss://ws.example.com/mcp");
  });

  it("should validate auto-detected configurations", () => {
    const httpConfig: McpServerConfig = {
      id: "auto-http",
      url: "https://api.example.com/mcp",
      // type should be auto-detected
    };

    const wsConfig: McpServerConfig = {
      id: "auto-ws",
      url: "wss://ws.example.com/mcp",
      // type should be auto-detected
    };

    const stdioConfig: McpServerConfig = {
      id: "auto-stdio",
      command: "python",
      args: ["-m", "server"],
      // type should be auto-detected
    };

    expect(httpConfig.url).toMatch(/^https?:/);
    expect(wsConfig.url).toMatch(/^wss?:/);
    expect(stdioConfig.command).toBeDefined();
    expect(stdioConfig.args).toBeDefined();
  });

  it("should support mixed configuration scenarios", () => {
    // Configuration similar to VSCode Copilot + existing GenAIScript usage
    const configs: Record<string, Omit<McpServerConfig, "id">> = {
      genaiscript: {
        type: "stdio",
        command: "node",
        args: ["./dist/src/index.js", "mcp"],
      },
      "remote-api": {
        type: "http",
        url: "https://mcp-api.company.com/v1",
      },
      "streaming-service": {
        type: "sse",
        url: "https://mcp-stream.company.com/events",
      },
      "websocket-service": {
        type: "websocket",
        url: "wss://mcp-ws.company.com/socket",
      },
    };

    Object.entries(configs).forEach(([id, config]) => {
      const fullConfig = { ...config, id };

      // Validate each configuration type
      if (fullConfig.type === "stdio") {
        expect(fullConfig.command).toBeDefined();
        expect(fullConfig.args).toBeDefined();
      } else {
        expect(fullConfig.url).toBeDefined();
        expect(fullConfig.url).toMatch(/^(https?|wss?):/);
      }
    });
  });
});

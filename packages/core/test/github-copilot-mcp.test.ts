import { describe, it, expect } from "vitest";
import type { GitHubCopilotMcpConfig } from "../src/types.js";
import { convertGitHubCopilotMcpConfig } from "../src/config.js";

describe("GitHub Copilot MCP Configuration", () => {
  it("should have GitHubCopilotMcpConfig type defined", () => {
    const copilotConfig: GitHubCopilotMcpConfig = {
      servers: {
        genaiscript: {
          type: "stdio",
          command: "npx",
          args: ["-y", "genaiscript", "mcp", "--cwd", "${workspaceFolder}"],
          envFile: "${workspaceFolder}/.env"
        },
        "remote-api": {
          type: "http",
          url: "https://api.example.com/mcp",
          version: "1.0.0"
        },
        "python-tools": {
          command: "python",
          args: ["-m", "mcp_server"],
          env: {
            "PYTHONPATH": "/custom/path"
          },
          cwd: "/working/dir"
        }
      }
    };

    expect(copilotConfig.servers).toBeDefined();
    expect(Object.keys(copilotConfig.servers)).toHaveLength(3);
    expect(copilotConfig.servers.genaiscript.type).toBe("stdio");
    expect(copilotConfig.servers["remote-api"].url).toBe("https://api.example.com/mcp");
    expect(copilotConfig.servers["python-tools"].env?.PYTHONPATH).toBe("/custom/path");
  });

  it("should handle empty GitHub Copilot MCP config", () => {
    const copilotConfig: GitHubCopilotMcpConfig = {
      servers: {}
    };

    expect(copilotConfig.servers).toEqual({});
    expect(Object.keys(copilotConfig.servers)).toHaveLength(0);
  });

  it("should convert GitHub Copilot MCP config to GenAIScript format", () => {
    const copilotConfig: GitHubCopilotMcpConfig = {
      servers: {
        genaiscript: {
          type: "stdio",
          command: "npx",
          args: ["-y", "genaiscript", "mcp", "--cwd", "${workspaceFolder}"],
          envFile: "${workspaceFolder}/.env"
        },
        "remote-api": {
          type: "http",
          url: "https://api.example.com/mcp",
          version: "1.0.0"
        },
        "python-tools": {
          command: "python",
          args: ["-m", "mcp_server"],
          env: {
            "PYTHONPATH": "/custom/path"
          },
          cwd: "/working/dir"
        }
      }
    };

    const converted = convertGitHubCopilotMcpConfig(copilotConfig);

    // envFile should be filtered out as it's not a valid McpServerConfig field
    expect(converted).toEqual({
      genaiscript: {
        type: "stdio",
        command: "npx",
        args: ["-y", "genaiscript", "mcp", "--cwd", "${workspaceFolder}"]
      },
      "remote-api": {
        type: "http",
        url: "https://api.example.com/mcp",
        version: "1.0.0"
      },
      "python-tools": {
        command: "python",
        args: ["-m", "mcp_server"],
        env: {
          "PYTHONPATH": "/custom/path"
        },
        cwd: "/working/dir"
      }
    });
  });

  it("should handle partial configurations", () => {
    const copilotConfig: GitHubCopilotMcpConfig = {
      servers: {
        "minimal-stdio": {
          command: "node",
          args: ["server.js"]
        },
        "minimal-http": {
          url: "http://localhost:8080/mcp"
        }
      }
    };

    const converted = convertGitHubCopilotMcpConfig(copilotConfig);

    expect(converted).toEqual({
      "minimal-stdio": {
        command: "node",
        args: ["server.js"]
      },
      "minimal-http": {
        url: "http://localhost:8080/mcp"
      }
    });
  });

  it("should filter out undefined values", () => {
    const copilotConfig: GitHubCopilotMcpConfig = {
      servers: {
        "server-with-optional-fields": {
          type: "stdio",
          command: "python",
          args: ["-m", "server"],
          // env, cwd, version, etc. are undefined and should be filtered out
        }
      }
    };

    const converted = convertGitHubCopilotMcpConfig(copilotConfig);

    expect(converted).toEqual({
      "server-with-optional-fields": {
        type: "stdio",
        command: "python",
        args: ["-m", "server"]
      }
    });

    // Ensure no undefined values are present
    const serverConfig = converted["server-with-optional-fields"];
    expect(serverConfig).not.toHaveProperty("env");
    expect(serverConfig).not.toHaveProperty("cwd");
    expect(serverConfig).not.toHaveProperty("version");
  });
});
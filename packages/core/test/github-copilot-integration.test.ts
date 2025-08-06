import { describe, it, expect } from "vitest";
import { readGitHubCopilotMcpConfig } from "../src/configmcp.js";
import { convertGitHubCopilotMcpConfig } from "../src/configmcp.js";
import { resolve } from "node:path";

describe("GitHub Copilot MCP File Reading", () => {
  it("should read actual .vscode/mcp.json file", async () => {
    const testConfigDir = resolve(import.meta.dirname, "testconfig");
    
    // This function is not exported, but let's create a simple version to test
    // the file reading functionality using the same logic
    const { tryReadText, tryStat } = await import("../src/fs.js");
    const { JSON5TryParse } = await import("../src/json5.js");
    
    const mcpConfigPath = resolve(testConfigDir, ".vscode", "mcp.json");
    const stat = await tryStat(mcpConfigPath);
    expect(stat).toBeTruthy();
    expect(stat?.isFile()).toBe(true);
    
    const fileContent = await tryReadText(mcpConfigPath);
    expect(fileContent).toBeTruthy();
    
    const copilotConfig = JSON5TryParse(fileContent!);
    expect(copilotConfig).toBeTruthy();
    expect(copilotConfig.servers).toBeDefined();
    
    const convertedConfig = convertGitHubCopilotMcpConfig(copilotConfig);
    expect(convertedConfig).toEqual({
      "test-genaiscript": {
        type: "stdio",
        command: "node",
        args: ["test-server.js"],
        env: {
          "NODE_ENV": "test"
        }
      },
      "test-api": {
        type: "http",
        url: "http://localhost:9000/test-mcp"
      }
    });
  });

  it("should read multiple directories and merge configs", async () => {
    const testConfigDir = resolve(import.meta.dirname, "testconfig");
    
    const mcpServers = await readGitHubCopilotMcpConfig([testConfigDir]);
    
    expect(mcpServers).toEqual({
      "test-genaiscript": {
        type: "stdio",
        command: "node",
        args: ["test-server.js"],
        env: {
          "NODE_ENV": "test"
        }
      },
      "test-api": {
        type: "http",
        url: "http://localhost:9000/test-mcp"
      }
    });
  });

  it("should handle non-existent directories gracefully", async () => {
    const mcpServers = await readGitHubCopilotMcpConfig([
      "/non/existent/directory",
      resolve(import.meta.dirname, "testconfig")
    ]);
    
    // Should still find the testconfig directory
    expect(Object.keys(mcpServers)).toHaveLength(2);
    expect(mcpServers["test-genaiscript"]).toBeDefined();
    expect(mcpServers["test-api"]).toBeDefined();
  });

  it("should test configuration merging", async () => {
    const { mergeHostConfigs } = await import("../src/config.js");
    
    // Test merging GitHub Copilot MCP config with GenAIScript config
    const testConfigDir = resolve(import.meta.dirname, "testconfig");
    const copilotMcpServers = await readGitHubCopilotMcpConfig([testConfigDir]);
    
    const config1 = {
      mcpServers: {
        "genai-server": {
          command: "python",
          args: ["-m", "genai_mcp"]
        }
      }
    };
    
    const config2 = {
      mcpServers: copilotMcpServers
    };
    
    const merged = mergeHostConfigs(config1, config2);
    
    expect(merged.mcpServers).toBeDefined();
    expect(Object.keys(merged.mcpServers!)).toHaveLength(3);
    expect(merged.mcpServers!["genai-server"]).toEqual({
      command: "python",
      args: ["-m", "genai_mcp"]
    });
    expect(merged.mcpServers!["test-genaiscript"]).toEqual({
      type: "stdio",
      command: "node",
      args: ["test-server.js"],
      env: {
        "NODE_ENV": "test"
      }
    });
    expect(merged.mcpServers!["test-api"]).toEqual({
      type: "http",
      url: "http://localhost:9000/test-mcp"
    });
  });
});
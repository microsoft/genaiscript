import { describe, it, expect } from "vitest";
import type { GitHubCopilotMcpConfig } from "../src/types.js";

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
});
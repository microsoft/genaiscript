// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Mock test directory
const testDir = resolve(process.cwd(), "temp-test-workspace");

// Mock the runtime host before importing
vi.mock("../src/host.js", () => ({
  resolveRuntimeHost: () => ({
    projectFolder: () => testDir
  })
}));

describe("MCP Server Resolution", () => {
  beforeEach(async () => {
    // Clean and create test workspace
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
    
    // Create test mcp.json files
    const vscodeMcp = {
      servers: {
        "test-server-1": {
          type: "stdio",
          command: "npx",
          args: ["-y", "test-package"],
          env: { "TEST_VAR": "value1" }
        },
        "test-server-2": {
          type: "stdio", 
          command: "node",
          args: ["server.js"]
        }
      }
    };

    const rulerMcp = {
      mcpServers: {
        "ruler-server": {
          command: "python",
          args: ["server.py"],
          env: { "PYTHON_PATH": "/usr/bin/python" }
        }
      }
    };

    const rootMcp = {
      servers: {
        "root-server": {
          command: "docker",
          args: ["run", "my-mcp-server"]
        }
      },
      mcpServers: {
        "claude-server": {
          command: "uvx",
          args: ["claude-server"]
        }
      }
    };

    // Create directories and files
    mkdirSync(resolve(testDir, ".vscode"), { recursive: true });
    mkdirSync(resolve(testDir, ".ruler"), { recursive: true });
    
    writeFileSync(
      resolve(testDir, ".vscode", "mcp.json"),
      JSON.stringify(vscodeMcp, null, 2)
    );
    
    writeFileSync(
      resolve(testDir, ".ruler", "mcp.json"),
      JSON.stringify(rulerMcp, null, 2)
    );
    
    writeFileSync(
      resolve(testDir, "mcp.json"),
      JSON.stringify(rootMcp, null, 2)
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  test("should resolve server from .vscode/mcp.json (Copilot format)", async () => {
    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("test-server-1");
    
    expect(config).toBeDefined();
    expect(config?.command).toBe("npx");
    expect(config?.args).toEqual(["-y", "test-package"]);
    expect(config?.env).toEqual({ "TEST_VAR": "value1" });
  });

  test("should resolve server from .ruler/mcp.json (Claude format)", async () => {
    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("ruler-server");
    
    expect(config).toBeDefined();
    expect(config?.command).toBe("python");
    expect(config?.args).toEqual(["server.py"]);
    expect(config?.env).toEqual({ "PYTHON_PATH": "/usr/bin/python" });
  });

  test("should resolve server from root mcp.json", async () => {
    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("root-server");
    
    expect(config).toBeDefined();
    expect(config?.command).toBe("docker");
    expect(config?.args).toEqual(["run", "my-mcp-server"]);
  });

  test("should resolve Claude format server from root mcp.json", async () => {
    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("claude-server");
    
    expect(config).toBeDefined();
    expect(config?.command).toBe("uvx");
    expect(config?.args).toEqual(["claude-server"]);
  });

  test("should return undefined for non-existent server", async () => {
    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("non-existent");
    
    expect(config).toBeUndefined();
  });

  test("should list all available servers", async () => {
    const { listAvailableMcpServers } = await import("../src/mcpresolver.js");
    
    const servers = listAvailableMcpServers();
    
    expect(servers).toContain("test-server-1");
    expect(servers).toContain("test-server-2"); 
    expect(servers).toContain("ruler-server");
    expect(servers).toContain("root-server");
    expect(servers).toContain("claude-server");
    expect(servers).toHaveLength(5);
    
    // Should be sorted
    const sortedServers = [...servers].sort();
    expect(servers).toEqual(sortedServers);
  });

  test("should prioritize .vscode over .ruler over root", async () => {
    // Create a server with same ID in multiple locations
    const conflictMcp = {
      servers: {
        "conflict-server": {
          command: "from-vscode"
        }
      }
    };
    
    const rulerConflictMcp = {
      mcpServers: {
        "conflict-server": {
          command: "from-ruler"
        }
      }
    };

    const rootConflictMcp = {
      servers: {
        "conflict-server": {
          command: "from-root"
        }
      }
    };

    writeFileSync(
      resolve(testDir, ".vscode", "mcp.json"),
      JSON.stringify(conflictMcp, null, 2)
    );
    
    writeFileSync(
      resolve(testDir, ".ruler", "mcp.json"),
      JSON.stringify(rulerConflictMcp, null, 2)
    );
    
    writeFileSync(
      resolve(testDir, "mcp.json"),
      JSON.stringify(rootConflictMcp, null, 2)
    );

    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("conflict-server");
    
    expect(config?.command).toBe("from-vscode");
  });
});
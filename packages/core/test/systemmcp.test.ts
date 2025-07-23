// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Mock test directory
const testDir = resolve(process.cwd(), "temp-system-mcp-test");

// Mock the runtime host before importing
vi.mock("../src/host.js", () => ({
  resolveRuntimeHost: () => ({
    projectFolder: () => testDir
  })
}));

// Mock the logger
vi.mock("../src/debug.js", () => ({
  genaiscriptDebug: () => (msg: string) => {
    // Mock debug function that does nothing
  }
}));

describe("System MCP Script Integration", () => {
  beforeEach(() => {
    // Clean and create test workspace
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
    
    // Create test mcp.json with server config
    const mcpConfig = {
      servers: {
        "test-memory-server": {
          type: "stdio",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
          env: { "MCP_LOG_LEVEL": "debug" }
        }
      }
    };

    mkdirSync(resolve(testDir, ".vscode"), { recursive: true });
    writeFileSync(
      resolve(testDir, ".vscode", "mcp.json"),
      JSON.stringify(mcpConfig, null, 2)
    );
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  test("should resolve server configuration from mcp.json by ID", async () => {
    const { resolveMcpServerById } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("test-memory-server");
    
    expect(config).toBeDefined();
    expect(config?.command).toBe("npx");
    expect(config?.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
    expect(config?.env).toEqual({ "MCP_LOG_LEVEL": "debug" });
  });

  test("should provide helpful error when server ID not found", async () => {
    const { resolveMcpServerById, listAvailableMcpServers } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("non-existent-server");
    expect(config).toBeUndefined();
    
    const available = listAvailableMcpServers();
    expect(available).toContain("test-memory-server");
  });

  test("should handle missing mcp.json files gracefully", async () => {
    // Remove all mcp.json files
    rmSync(testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });
    
    const { resolveMcpServerById, listAvailableMcpServers } = await import("../src/mcpresolver.js");
    
    const config = resolveMcpServerById("any-server");
    expect(config).toBeUndefined();
    
    const available = listAvailableMcpServers();
    expect(available).toHaveLength(0);
  });
});
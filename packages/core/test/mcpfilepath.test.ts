import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { parsePromptScript } from "../src/template.js";
import type { McpServerConfig } from "../src/types.js";

describe("MCP Configuration File Path Support", () => {
  const testDir = "/tmp/mcp-test";
  const configFile = join(testDir, "mcp-config.json");
  const agentConfigFile = join(testDir, "mcp-agent-config.json");
  const scriptFile = join(testDir, "test-script.genai.mts");

  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Create a sample MCP configuration file (Claude format)
    const mcpConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
        },
      },
    };
    await writeFile(configFile, JSON.stringify(mcpConfig, null, 2));

    // Create a sample MCP agent configuration file (Claude format)
    const mcpAgentConfig = {
      mcpAgentServers: {
        memory: {
          description: "A memory server",
          instructions: "Use this server to store and retrieve data.",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        filesystem: {
          description: "A filesystem server",
          instructions: "Use this server to read and write files.",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
        },
      },
    };
    await writeFile(agentConfigFile, JSON.stringify(mcpAgentConfig, null, 2));
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  it("should load MCP servers configuration from file path", async () => {
    const scriptContent = `
script({
  title: "Test Script with MCP File Path",
  mcpServers: "./mcp-config.json"
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    const script = await parsePromptScript(scriptFile, scriptContent);

    expect(script).toBeDefined();
    expect(script.mcpServers).toBeDefined();
    expect(typeof script.mcpServers).toBe("object");
    
    const mcpServers = script.mcpServers as Record<string, Omit<McpServerConfig, "id" | "options">>;
    expect(mcpServers.memory).toBeDefined();
    expect(mcpServers.memory.command).toBe("npx");
    expect(mcpServers.memory.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
    
    expect(mcpServers.filesystem).toBeDefined();
    expect(mcpServers.filesystem.command).toBe("npx");
    expect(mcpServers.filesystem.args).toEqual(["-y", "@modelcontextprotocol/server-filesystem", "."]);
  });

  it("should load MCP agent servers configuration from file path", async () => {
    const scriptContent = `
script({
  title: "Test Script with MCP Agent File Path",
  mcpAgentServers: "./mcp-agent-config.json"
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    const script = await parsePromptScript(scriptFile, scriptContent);

    expect(script).toBeDefined();
    expect(script.mcpAgentServers).toBeDefined();
    expect(typeof script.mcpAgentServers).toBe("object");
    
    const mcpAgentServers = script.mcpAgentServers as Record<string, any>;
    expect(mcpAgentServers.memory).toBeDefined();
    expect(mcpAgentServers.memory.description).toBe("A memory server");
    expect(mcpAgentServers.memory.instructions).toBe("Use this server to store and retrieve data.");
    expect(mcpAgentServers.memory.command).toBe("npx");
    expect(mcpAgentServers.memory.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
    
    expect(mcpAgentServers.filesystem).toBeDefined();
    expect(mcpAgentServers.filesystem.description).toBe("A filesystem server");
    expect(mcpAgentServers.filesystem.instructions).toBe("Use this server to read and write files.");
  });

  it("should still support inline MCP servers configuration", async () => {
    const scriptContent = `
script({
  title: "Test Script with Inline MCP",
  mcpServers: {
    memory: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    const script = await parsePromptScript(scriptFile, scriptContent);

    expect(script).toBeDefined();
    expect(script.mcpServers).toBeDefined();
    expect(typeof script.mcpServers).toBe("object");
    
    const mcpServers = script.mcpServers as Record<string, Omit<McpServerConfig, "id" | "options">>;
    expect(mcpServers.memory).toBeDefined();
    expect(mcpServers.memory.command).toBe("npx");
    expect(mcpServers.memory.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
  });

  it("should handle non-existent config file gracefully", async () => {
    const scriptContent = `
script({
  title: "Test Script with Non-existent MCP File",
  mcpServers: "./non-existent-config.json"
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    
    // Should not throw, but might log an error
    const script = await parsePromptScript(scriptFile, scriptContent);
    
    expect(script).toBeDefined();
    // The mcpServers field should remain as the original file path string
    // since the file couldn't be loaded (our error handling preserves the original value)
    expect(script.mcpServers).toBe("./non-existent-config.json");
  });

  it("should handle absolute file paths", async () => {
    const scriptContent = `
script({
  title: "Test Script with Absolute MCP File Path",
  mcpServers: "${configFile}"
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    const script = await parsePromptScript(scriptFile, scriptContent);

    expect(script).toBeDefined();
    expect(script.mcpServers).toBeDefined();
    expect(typeof script.mcpServers).toBe("object");
    
    const mcpServers = script.mcpServers as Record<string, Omit<McpServerConfig, "id" | "options">>;
    expect(mcpServers.memory).toBeDefined();
    expect(mcpServers.filesystem).toBeDefined();
  });

  it("should support backward compatibility with old format (servers at root)", async () => {
    const oldFormatConfigFile = join(testDir, "mcp-config-old.json");
    
    // Create a config file with the old format (servers directly at root)
    const oldMcpConfig = {
      memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
      },
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
      },
    };
    await writeFile(oldFormatConfigFile, JSON.stringify(oldMcpConfig, null, 2));

    const scriptContent = `
script({
  title: "Test Script with Old Format MCP File",
  mcpServers: "./mcp-config-old.json"
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    const script = await parsePromptScript(scriptFile, scriptContent);

    expect(script).toBeDefined();
    expect(script.mcpServers).toBeDefined();
    expect(typeof script.mcpServers).toBe("object");
    
    const mcpServers = script.mcpServers as Record<string, Omit<McpServerConfig, "id" | "options">>;
    expect(mcpServers.memory).toBeDefined();
    expect(mcpServers.memory.command).toBe("npx");
    expect(mcpServers.memory.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
    
    expect(mcpServers.filesystem).toBeDefined();
    expect(mcpServers.filesystem.command).toBe("npx");
    expect(mcpServers.filesystem.args).toEqual(["-y", "@modelcontextprotocol/server-filesystem", "."]);
  });

  it("should support backward compatibility with old format for agent servers", async () => {
    const oldFormatAgentConfigFile = join(testDir, "mcp-agent-config-old.json");
    
    // Create a config file with the old format (servers directly at root)
    const oldMcpAgentConfig = {
      memory: {
        description: "A memory server",
        instructions: "Use this server to store and retrieve data.",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
      },
      filesystem: {
        description: "A filesystem server",
        instructions: "Use this server to read and write files.",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
      },
    };
    await writeFile(oldFormatAgentConfigFile, JSON.stringify(oldMcpAgentConfig, null, 2));

    const scriptContent = `
script({
  title: "Test Script with Old Format MCP Agent File",
  mcpAgentServers: "./mcp-agent-config-old.json"
})

$\`Hello world\`
`;

    await writeFile(scriptFile, scriptContent);
    const script = await parsePromptScript(scriptFile, scriptContent);

    expect(script).toBeDefined();
    expect(script.mcpAgentServers).toBeDefined();
    expect(typeof script.mcpAgentServers).toBe("object");
    
    const mcpAgentServers = script.mcpAgentServers as Record<string, any>;
    expect(mcpAgentServers.memory).toBeDefined();
    expect(mcpAgentServers.memory.description).toBe("A memory server");
    expect(mcpAgentServers.memory.instructions).toBe("Use this server to store and retrieve data.");
    expect(mcpAgentServers.memory.command).toBe("npx");
    expect(mcpAgentServers.memory.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
    
    expect(mcpAgentServers.filesystem).toBeDefined();
    expect(mcpAgentServers.filesystem.description).toBe("A filesystem server");
    expect(mcpAgentServers.filesystem.instructions).toBe("Use this server to read and write files.");
  });
});
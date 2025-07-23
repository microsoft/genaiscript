// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { resolveRuntimeHost } from "./host.js";
import { genaiscriptDebug } from "./debug.js";
import type { McpServerConfig } from "./types.js";

const dbg = genaiscriptDebug("mcp:resolver");

interface McpJsonCopilotFormat {
  servers?: Record<string, {
    type?: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    envFile?: string;
  }>;
}

interface McpJsonClaudeFormat {
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

type McpJsonFormat = McpJsonCopilotFormat | McpJsonClaudeFormat;

/**
 * Resolves MCP server configuration by ID from mcp.json files following Copilot conventions.
 * Searches in order: .vscode/mcp.json, .ruler/mcp.json, mcp.json (root)
 * 
 * @param serverId - The ID of the MCP server to resolve
 * @returns The resolved McpServerConfig or undefined if not found
 */
export function resolveMcpServerById(serverId: string): Omit<McpServerConfig, "id"> | undefined {
  const runtimeHost = resolveRuntimeHost();
  const projectFolder = runtimeHost.projectFolder();
  
  const mcpJsonPaths = [
    resolve(projectFolder, ".vscode", "mcp.json"),
    resolve(projectFolder, ".ruler", "mcp.json"),
    resolve(projectFolder, "mcp.json"),
  ];

  for (const mcpJsonPath of mcpJsonPaths) {
    dbg(`checking ${mcpJsonPath}`);
    if (!existsSync(mcpJsonPath)) {
      continue;
    }

    try {
      const content = readFileSync(mcpJsonPath, "utf-8");
      const mcpConfig = JSON.parse(content) as McpJsonFormat;
      
      // Try Copilot Chat format first (servers)
      if ('servers' in mcpConfig && mcpConfig.servers?.[serverId]) {
        const serverConfig = mcpConfig.servers[serverId];
        dbg(`found server "${serverId}" in ${mcpJsonPath} (Copilot format)`);
        
        return {
          command: serverConfig.command,
          args: serverConfig.args || [],
          env: serverConfig.env,
          // Note: envFile is not directly supported in McpServerConfig, would need enhancement
        };
      }
      
      // Try Claude format (mcpServers)
      if ('mcpServers' in mcpConfig && mcpConfig.mcpServers?.[serverId]) {
        const serverConfig = mcpConfig.mcpServers[serverId];
        dbg(`found server "${serverId}" in ${mcpJsonPath} (Claude format)`);
        
        return {
          command: serverConfig.command,
          args: serverConfig.args || [],
          env: serverConfig.env,
        };
      }
    } catch (error) {
      dbg(`failed to parse ${mcpJsonPath}: ${error}`);
      continue;
    }
  }

  dbg(`server "${serverId}" not found in any mcp.json files`);
  return undefined;
}

/**
 * Lists all available MCP server IDs from mcp.json files
 * 
 * @returns Array of server IDs found in mcp.json files
 */
export function listAvailableMcpServers(): string[] {
  const runtimeHost = resolveRuntimeHost();
  const projectFolder = runtimeHost.projectFolder();
  
  const mcpJsonPaths = [
    resolve(projectFolder, ".vscode", "mcp.json"),
    resolve(projectFolder, ".ruler", "mcp.json"),
    resolve(projectFolder, "mcp.json"),
  ];

  const serverIds = new Set<string>();

  for (const mcpJsonPath of mcpJsonPaths) {
    if (!existsSync(mcpJsonPath)) {
      continue;
    }

    try {
      const content = readFileSync(mcpJsonPath, "utf-8");
      const mcpConfig = JSON.parse(content) as McpJsonFormat;
      
      // Collect from Copilot Chat format
      if ('servers' in mcpConfig && mcpConfig.servers) {
        Object.keys(mcpConfig.servers).forEach(id => serverIds.add(id));
      }
      
      // Collect from Claude format
      if ('mcpServers' in mcpConfig && mcpConfig.mcpServers) {
        Object.keys(mcpConfig.mcpServers).forEach(id => serverIds.add(id));
      }
    } catch (error) {
      dbg(`failed to parse ${mcpJsonPath}: ${error}`);
      continue;
    }
  }

  return Array.from(serverIds).sort();
}
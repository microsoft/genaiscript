// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resolve } from "node:path";
import { JSON5TryParse } from "./json5.js";
import { expandHomeDir, tryReadText, tryStat } from "./fs.js";
import { deleteEmptyValues } from "./cleaners.js";
import { errorMessage } from "./error.js";
import { genaiscriptDebug } from "./debug.js";
import type { 
  GitHubCopilotMcpConfig, 
  GitHubCopilotMcpServerConfig, 
  McpServersConfig,
  McpServerConfig
} from "./types.js";

const dbg = genaiscriptDebug("config");

/**
 * Converts GitHub Copilot MCP configuration format to GenAIScript format
 */
export function convertGitHubCopilotMcpConfig(copilotConfig: GitHubCopilotMcpConfig): McpServersConfig {
  const mcpServers: McpServersConfig = {};
  
  for (const [id, serverConfig] of Object.entries(copilotConfig.servers)) {
    const convertedConfig: Omit<McpServerConfig, "id" | "options"> = {
      type: serverConfig.type,
      command: serverConfig.command,
      args: serverConfig.args,
      url: serverConfig.url,
      env: serverConfig.env,
      cwd: serverConfig.cwd,
      version: serverConfig.version,
    };
    
    // Remove undefined values to keep the config clean
    mcpServers[id] = deleteEmptyValues(convertedConfig);
  }
  return mcpServers;
}

/**
 * Reads GitHub Copilot MCP configuration from .vscode/mcp.json files
 */
export async function readGitHubCopilotMcpConfig(dirs: string[]): Promise<McpServersConfig> {
  const mcpServers: McpServersConfig = {};
  
  for (const dir of dirs) {
    const mcpConfigPath = resolve(dir, ".vscode", "mcp.json");
    dbg(`checking GitHub Copilot MCP config: ${mcpConfigPath}`);
    
    const stat = await tryStat(mcpConfigPath);
    if (!stat || !stat.isFile()) {
      dbg(`skipping ${mcpConfigPath}, not found or not a file`);
      continue;
    }
    
    const fileContent = await tryReadText(mcpConfigPath);
    if (!fileContent) {
      dbg(`skipping ${mcpConfigPath}, no content`);
      continue;
    }
    
    try {
      dbg(`loading GitHub Copilot MCP config from ${mcpConfigPath}`);
      const copilotConfig: GitHubCopilotMcpConfig = JSON5TryParse(fileContent);
      if (!copilotConfig || !copilotConfig.servers) {
        dbg(`skipping ${mcpConfigPath}, invalid format`);
        continue;
      }
      
      const convertedConfig = convertGitHubCopilotMcpConfig(copilotConfig);
      Object.assign(mcpServers, convertedConfig);
      dbg(`loaded ${Object.keys(convertedConfig).length} MCP servers from ${mcpConfigPath}`);
    } catch (error) {
      dbg(`failed to parse ${mcpConfigPath}: ${errorMessage(error)}`);
    }
  }
  
  return mcpServers;
}
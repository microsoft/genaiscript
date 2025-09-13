import { readJSON } from "fs-extra"
import { resolve, dirname } from "node:path"
import { existsSync } from "node:fs"
import { genaiscriptDebug } from "../../core/src/debug"

const dbg = genaiscriptDebug("mcp:config")

/**
 * Claude MCP configuration file format
 */
interface ClaudeMcpConfig {
    servers?: Record<string, ClaudeMcpServerConfig>
    mcpServers?: Record<string, ClaudeMcpServerConfig>
}

interface ClaudeMcpServerConfig {
    type?: "stdio"
    command: string
    args?: string[]
    env?: Record<string, string>
    envFile?: string
    cwd?: string
}

/**
 * Interpolates Claude environment variables in a string
 * Supports ${workspaceFolder}, ${env:VARIABLE_NAME}, ${VARIABLE_NAME} (for capitalized env vars), etc.
 */
function interpolateClaudeVariables(
    value: string,
    workspaceFolder: string,
    env: Record<string, string> = process.env
): string {
    return value
        .replace(/\$\{workspaceFolder\}/g, workspaceFolder)
        .replace(/\$\{env:([^}]+)\}/g, (_, varName) => env[varName] || "")
        .replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, varName) => env[varName] || "")
}

/**
 * Recursively interpolates Claude variables in an object
 */
function interpolateObjectValues(
    obj: any,
    workspaceFolder: string,
    env: Record<string, string> = process.env
): any {
    if (typeof obj === "string") {
        return interpolateClaudeVariables(obj, workspaceFolder, env)
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => interpolateObjectValues(item, workspaceFolder, env))
    }
    if (obj && typeof obj === "object") {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
            result[key] = interpolateObjectValues(value, workspaceFolder, env)
        }
        return result
    }
    return obj
}

/**
 * Loads and parses a Claude MCP configuration file
 * @param configPath Path to the MCP configuration file
 * @param workspaceFolder Workspace folder for variable interpolation (defaults to config file directory)
 * @returns Parsed MCP server configurations
 */
export async function loadClaudeMcpConfig(
    configPath: string,
    workspaceFolder?: string
): Promise<Record<string, any>> {
    const resolvedPath = resolve(configPath)
    
    dbg(`Loading MCP configuration from: ${resolvedPath}`)
    
    if (!existsSync(resolvedPath)) {
        throw new Error(`MCP configuration file not found: ${resolvedPath}`)
    }

    let config: ClaudeMcpConfig
    try {
        config = await readJSON(resolvedPath)
        dbg(`Successfully parsed MCP configuration file`)
    } catch (error) {
        dbg(`Failed to parse MCP configuration file: ${error.message}`)
        throw new Error(`Failed to parse MCP configuration file: ${error.message}`)
    }

    // Support both "servers" and "mcpServers" key names
    const serversConfig = config.servers || config.mcpServers
    if (!serversConfig || typeof serversConfig !== "object") {
        throw new Error("Invalid MCP configuration: missing or invalid 'servers' or 'mcpServers' object")
    }

    // Use config file directory as workspace folder if not provided
    const wsFolder = workspaceFolder || dirname(resolvedPath)
    dbg(`Using workspace folder: ${wsFolder}`)
    
    // Convert Claude format to GenAIScript format
    const mcpServers: Record<string, any> = {}
    
    for (const [serverId, serverConfig] of Object.entries(serversConfig)) {
        dbg(`Processing server: ${serverId}`)
        
        // Interpolate variables in the server configuration
        const interpolatedConfig = interpolateObjectValues(serverConfig, wsFolder)
        
        dbg(`Interpolated config for ${serverId}:`, interpolatedConfig)
        
        // Convert to GenAIScript McpServerConfig format
        const genaiscriptConfig = {
            command: interpolatedConfig.command,
            args: interpolatedConfig.args || [],
            env: interpolatedConfig.env,
            cwd: interpolatedConfig.cwd
        }
        
        mcpServers[serverId] = genaiscriptConfig
    }
    
    dbg(`Loaded ${Object.keys(mcpServers).length} MCP servers:`, Object.keys(mcpServers))
    
    return mcpServers
}
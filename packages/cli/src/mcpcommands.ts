/**
 * MCP (Model Context Protocol) commands similar to Claude CLI
 * Provides add, list, get, remove, and inspect commands for managing MCP servers
 * within agentic workflows.
 */
import { Command } from "commander"
import { logVerbose, logError } from "../../core/src/util"
import { startMcpServer } from "./mcpserver"
import { ScriptFilterOptions } from "../../core/src/ast"
import { RemoteOptions } from "./remote"
import { ensureDotGenaiscriptPath } from "../../core/src/workdir"
import { readJSON, writeJSON, tryReadJSON } from "../../core/src/fs"
import path from "node:path"

export interface McpServerConfig {
    name: string
    transport?: "stdio" | "sse" | "http"
    command?: string
    args?: string[]
    url?: string
    env?: Record<string, string>
    headers?: Record<string, string>
    scope?: string
}

/**
 * Storage for MCP server configurations per workflow
 */
class McpConfigManager {
    private async getConfigPath(workflowId: string): Promise<string> {
        const dotPath = await ensureDotGenaiscriptPath()
        return path.join(dotPath, "mcp", `${workflowId}.json`)
    }

    async getWorkflowConfigs(workflowId: string): Promise<Map<string, McpServerConfig>> {
        const configPath = await this.getConfigPath(workflowId)
        const configs = await tryReadJSON(configPath) as Record<string, McpServerConfig>
        return new Map(Object.entries(configs || {}))
    }

    async saveWorkflowConfigs(workflowId: string, configs: Map<string, McpServerConfig>): Promise<void> {
        const configPath = await this.getConfigPath(workflowId)
        const configData = Object.fromEntries(configs)
        await writeJSON(configPath, configData)
    }

    async addServer(workflowId: string, config: McpServerConfig): Promise<void> {
        const workflowConfigs = await this.getWorkflowConfigs(workflowId)
        workflowConfigs.set(config.name, config)
        await this.saveWorkflowConfigs(workflowId, workflowConfigs)
    }

    async removeServer(workflowId: string, name: string): Promise<boolean> {
        const workflowConfigs = await this.getWorkflowConfigs(workflowId)
        const removed = workflowConfigs.delete(name)
        if (removed) {
            await this.saveWorkflowConfigs(workflowId, workflowConfigs)
        }
        return removed
    }

    async getServer(workflowId: string, name: string): Promise<McpServerConfig | undefined> {
        const workflowConfigs = await this.getWorkflowConfigs(workflowId)
        return workflowConfigs.get(name)
    }

    async listServers(workflowId: string): Promise<McpServerConfig[]> {
        const workflowConfigs = await this.getWorkflowConfigs(workflowId)
        return Array.from(workflowConfigs.values())
    }
}

const configManager = new McpConfigManager()

async function mcpAdd(
    name: string,
    commandOrUrl: string,
    args: string[] = [],
    options: {
        transport?: string
        env?: string[]
        header?: string[]
        scope?: string
        workflowId?: string
    } & ScriptFilterOptions & RemoteOptions
): Promise<void> {
    const { transport = "stdio", env = [], header = [], scope, workflowId = "default" } = options

    logVerbose(`Adding MCP server: ${name}`)

    // Parse environment variables (NAME=VALUE format)
    const envVars: Record<string, string> = {}
    for (const envVar of env) {
        const equalIndex = envVar.indexOf("=")
        if (equalIndex > 0) {
            const key = envVar.slice(0, equalIndex)
            const value = envVar.slice(equalIndex + 1)
            envVars[key] = value
        }
    }

    // Parse headers (NAME:VALUE format)
    const headers: Record<string, string> = {}
    for (const headerVar of header) {
        const colonIndex = headerVar.indexOf(":")
        if (colonIndex > 0) {
            const key = headerVar.slice(0, colonIndex).trim()
            const value = headerVar.slice(colonIndex + 1).trim()
            headers[key] = value
        }
    }

    const config: McpServerConfig = {
        name,
        transport: transport as "stdio" | "sse" | "http",
        env: Object.keys(envVars).length > 0 ? envVars : undefined,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        scope,
    }

    if (transport === "stdio") {
        config.command = commandOrUrl
        config.args = args.length > 0 ? args : undefined
    } else {
        config.url = commandOrUrl
    }

    await configManager.addServer(workflowId, config)
    console.log(`Added MCP server '${name}' to workflow '${workflowId}'`)
}

async function mcpList(workflowId: string = "default"): Promise<void> {
    logVerbose(`Listing MCP servers for workflow: ${workflowId}`)
    
    const servers = await configManager.listServers(workflowId)
    
    if (servers.length === 0) {
        console.log(`No MCP servers configured for workflow '${workflowId}'`)
        return
    }

    console.log(`MCP servers for workflow '${workflowId}':`)
    for (const server of servers) {
        console.log(`\n${server.name}:`)
        console.log(`  Transport: ${server.transport}`)
        
        if (server.transport === "stdio") {
            console.log(`  Command: ${server.command}`)
            if (server.args && server.args.length > 0) {
                console.log(`  Args: ${server.args.join(" ")}`)
            }
        } else {
            console.log(`  URL: ${server.url}`)
        }
        
        if (server.env && Object.keys(server.env).length > 0) {
            console.log(`  Environment:`)
            for (const [key, value] of Object.entries(server.env)) {
                console.log(`    ${key}=${value}`)
            }
        }
        
        if (server.headers && Object.keys(server.headers).length > 0) {
            console.log(`  Headers:`)
            for (const [key, value] of Object.entries(server.headers)) {
                console.log(`    ${key}: ${value}`)
            }
        }
        
        if (server.scope) {
            console.log(`  Scope: ${server.scope}`)
        }
    }
}

async function mcpGet(name: string, workflowId: string = "default"): Promise<void> {
    logVerbose(`Getting MCP server: ${name} from workflow: ${workflowId}`)
    
    const server = await configManager.getServer(workflowId, name)
    
    if (!server) {
        console.error(`MCP server '${name}' not found in workflow '${workflowId}'`)
        process.exit(1)
    }

    console.log(`MCP server '${name}' in workflow '${workflowId}':`)
    console.log(JSON.stringify(server, null, 2))
}

async function mcpRemove(name: string, workflowId: string = "default"): Promise<void> {
    logVerbose(`Removing MCP server: ${name} from workflow: ${workflowId}`)
    
    const removed = await configManager.removeServer(workflowId, name)
    
    if (removed) {
        console.log(`Removed MCP server '${name}' from workflow '${workflowId}'`)
    } else {
        console.error(`MCP server '${name}' not found in workflow '${workflowId}'`)
        process.exit(1)
    }
}

async function mcpInspect(
    workflowId: string = "default",
    options: ScriptFilterOptions & RemoteOptions & { startup?: string } = {}
): Promise<void> {
    logVerbose(`Inspecting MCP server for workflow: ${workflowId}`)
    
    // This uses the existing MCP server functionality to start and inspect
    await startMcpServer(options)
}

/**
 * Sets up the MCP command group with all subcommands
 */
export function setupMcpCommands(program: Command): void {
    // Create the main "aw" (agentic workflow) command group
    const aw = program
        .command("aw")
        .description("Agentic workflow commands")

    // Create the MCP subcommand group under aw
    const mcp = aw
        .command("mcp")
        .description("Model Context Protocol server management")

    // mcp add command
    mcp
        .command("add")
        .argument("<name>", "Name of the MCP server")
        .argument("<command_or_url>", "Command to run the server or URL for remote servers")
        .argument("[args...]", "Arguments to pass to the command (for stdio transport)")
        .option("--transport <type>", "Transport type: stdio, sse, or http", "stdio")
        .option("--env <namevalue...>", "Environment variables as NAME=VALUE")
        .option("--header <namevalue...>", "Headers as NAME:VALUE (for sse/http transports)")
        .option("--scope <string>", "Scope for the server")
        .option("--workflow-id <string>", "Workflow ID", "default")
        .description("Add a new MCP server configuration")
        .action(async (name, commandOrUrl, args, options) => {
            try {
                await mcpAdd(name, commandOrUrl, args, options)
            } catch (error) {
                logError("Failed to add MCP server", error)
                process.exit(1)
            }
        })

    // mcp list command
    mcp
        .command("list")
        .argument("[workflow_id]", "Workflow ID", "default")
        .description("List all configured MCP servers for a workflow")
        .action(async (workflowId) => {
            try {
                await mcpList(workflowId)
            } catch (error) {
                logError("Failed to list MCP servers", error)
                process.exit(1)
            }
        })

    // mcp get command
    mcp
        .command("get")
        .argument("<name>", "Name of the MCP server")
        .argument("[workflow_id]", "Workflow ID", "default")
        .description("Get details for a specific MCP server")
        .action(async (name, workflowId) => {
            try {
                await mcpGet(name, workflowId)
            } catch (error) {
                logError("Failed to get MCP server details", error)
                process.exit(1)
            }
        })

    // mcp remove command
    mcp
        .command("remove")
        .argument("<name>", "Name of the MCP server")
        .argument("[workflow_id]", "Workflow ID", "default")
        .description("Remove an MCP server configuration")
        .action(async (name, workflowId) => {
            try {
                await mcpRemove(name, workflowId)
            } catch (error) {
                logError("Failed to remove MCP server", error)
                process.exit(1)
            }
        })

    // mcp inspect command (moved from the main mcp command)
    mcp
        .command("inspect")
        .argument("[workflow_id]", "Workflow ID", "default")
        .option("--groups <string...>", "Filter script by groups")
        .option("--ids <string...>", "Filter script by ids")
        .option("--startup <string>", "Startup script id, executed after the server is started")
        .description("Inspect MCP server for a workflow")
        .action(async (workflowId, options) => {
            try {
                await mcpInspect(workflowId, options)
            } catch (error) {
                logError("Failed to inspect MCP server", error)
                process.exit(1)
            }
        })
}
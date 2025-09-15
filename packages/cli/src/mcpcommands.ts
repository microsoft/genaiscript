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
import { frontmatterTryParse, updateFrontmatter } from "../../core/src/frontmatter"
import { runtimeHost } from "../../core/src/host"
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
 * Storage for MCP server configurations in agentic workflow frontmatter
 */
class McpConfigManager {
    async getWorkflowPath(workflowId: string): Promise<string> {
        // If workflowId contains a path separator, treat it as a file path
        if (workflowId.includes('/') || workflowId.includes('\\') || workflowId.endsWith('.genai.mts') || workflowId.endsWith('.genai.mjs') || workflowId.endsWith('.genai.js')) {
            return workflowId
        }
        
        // Otherwise, look for a file with that name in common locations
        const possiblePaths = [
            `genaisrc/${workflowId}.genai.mts`,
            `genaisrc/${workflowId}.genai.mjs`, 
            `genaisrc/${workflowId}.genai.js`,
            `src/${workflowId}.genai.mts`,
            `src/${workflowId}.genai.mjs`,
            `src/${workflowId}.genai.js`,
            `${workflowId}.genai.mts`,
            `${workflowId}.genai.mjs`,
            `${workflowId}.genai.js`
        ]
        
        for (const path of possiblePaths) {
            try {
                await runtimeHost.readFile(path)
                return path
            } catch {
                // File doesn't exist, continue
            }
        }
        
        throw new Error(`Workflow file not found for: ${workflowId}. Please provide the full path to the .genai file.`)
    }

    async getWorkflowTools(workflowId: string): Promise<string[]> {
        const workflowPath = await this.getWorkflowPath(workflowId)
        const content = await runtimeHost.readFile(workflowPath)
        const frontmatter = frontmatterTryParse(content)
        
        if (!frontmatter?.value) {
            return []
        }
        
        const tools = frontmatter.value.tools
        if (!tools) {
            return []
        }
        
        return Array.isArray(tools) ? tools : [tools]
    }

    async saveWorkflowTools(workflowId: string, tools: string[]): Promise<void> {
        const workflowPath = await this.getWorkflowPath(workflowId)
        const content = await runtimeHost.readFile(workflowPath)
        
        const newFrontmatter = { tools: tools.length > 0 ? tools : null }
        const updatedContent = updateFrontmatter(content, newFrontmatter)
        
        await runtimeHost.writeFile(workflowPath, updatedContent)
    }

    async addServer(workflowId: string, config: McpServerConfig): Promise<void> {
        const tools = await this.getWorkflowTools(workflowId)
        const mcpToolName = `mcp:${config.name}`
        
        // Remove existing config for this server if it exists
        const filteredTools = tools.filter(tool => tool !== mcpToolName && !tool.startsWith(`mcp:${config.name}:`))
        
        // Add the new MCP tool
        filteredTools.push(mcpToolName)
        
        await this.saveWorkflowTools(workflowId, filteredTools)
        
        // Store the detailed configuration separately for retrieval
        // We'll store it in a comment or as a separate metadata file
        const dotPath = await ensureDotGenaiscriptPath()
        const mcpMetadataPath = path.join(dotPath, "mcp", `${config.name}.json`)
        await writeJSON(mcpMetadataPath, config)
    }

    async removeServer(workflowId: string, name: string): Promise<boolean> {
        const tools = await this.getWorkflowTools(workflowId)
        const mcpToolName = `mcp:${name}`
        
        const originalLength = tools.length
        const filteredTools = tools.filter(tool => tool !== mcpToolName && !tool.startsWith(`mcp:${name}:`))
        
        if (filteredTools.length < originalLength) {
            await this.saveWorkflowTools(workflowId, filteredTools)
            
            // Also remove the metadata file
            try {
                const dotPath = await ensureDotGenaiscriptPath()
                const mcpMetadataPath = path.join(dotPath, "mcp", `${name}.json`)
                await runtimeHost.deleteFile(mcpMetadataPath)
            } catch {
                // Metadata file might not exist, ignore
            }
            
            return true
        }
        
        return false
    }

    async getServer(workflowId: string, name: string): Promise<McpServerConfig | undefined> {
        const tools = await this.getWorkflowTools(workflowId)
        const mcpToolName = `mcp:${name}`
        
        if (!tools.includes(mcpToolName)) {
            return undefined
        }
        
        // Try to load detailed configuration from metadata
        try {
            const dotPath = await ensureDotGenaiscriptPath()
            const mcpMetadataPath = path.join(dotPath, "mcp", `${name}.json`)
            const config = await tryReadJSON(mcpMetadataPath) as McpServerConfig
            return config
        } catch {
            // Return basic config if no metadata available
            return { name, transport: "stdio" }
        }
    }

    async listServers(workflowId: string): Promise<McpServerConfig[]> {
        const tools = await this.getWorkflowTools(workflowId)
        const mcpTools = tools.filter(tool => tool.startsWith('mcp:'))
        
        const servers: McpServerConfig[] = []
        
        for (const mcpTool of mcpTools) {
            const name = mcpTool.substring(4) // Remove 'mcp:' prefix
            const server = await this.getServer(workflowId, name)
            if (server) {
                servers.push(server)
            }
        }
        
        return servers
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
        workflow?: string
    } & ScriptFilterOptions & RemoteOptions
): Promise<void> {
    const { transport = "stdio", env = [], header = [], scope, workflow = "default" } = options

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

    await configManager.addServer(workflow, config)
    console.log(`Added MCP server '${name}' to workflow '${workflow}'`)
}

async function mcpList(workflow: string = "default"): Promise<void> {
    logVerbose(`Listing MCP servers for workflow: ${workflow}`)
    
    const servers = await configManager.listServers(workflow)
    
    if (servers.length === 0) {
        console.log(`No MCP servers configured for workflow '${workflow}'`)
        return
    }

    console.log(`MCP servers for workflow '${workflow}':`)
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

async function mcpGet(name: string, workflow: string = "default"): Promise<void> {
    logVerbose(`Getting MCP server: ${name} from workflow: ${workflow}`)
    
    const server = await configManager.getServer(workflow, name)
    
    if (!server) {
        console.error(`MCP server '${name}' not found in workflow '${workflow}'`)
        process.exit(1)
    }

    console.log(`MCP server '${name}' in workflow '${workflow}':`)
    console.log(JSON.stringify(server, null, 2))
}

async function mcpRemove(name: string, workflow: string = "default"): Promise<void> {
    logVerbose(`Removing MCP server: ${name} from workflow: ${workflow}`)
    
    const removed = await configManager.removeServer(workflow, name)
    
    if (removed) {
        console.log(`Removed MCP server '${name}' from workflow '${workflow}'`)
    } else {
        console.error(`MCP server '${name}' not found in workflow '${workflow}'`)
        process.exit(1)
    }
}

async function mcpInspect(
    workflow: string = "default",
    options: ScriptFilterOptions & RemoteOptions & { startup?: string } = {}
): Promise<void> {
    logVerbose(`Inspecting MCP server for workflow: ${workflow}`)
    
    // This uses the existing MCP server functionality to start and inspect
    await startMcpServer(options)
}

/**
 * Sets up the MCP command group with all subcommands
 */
export function setupMcpCommands(program: Command): void {
    // Create the MCP command group directly under main program
    const mcp = program
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
        .option("--workflow <file>", "Agentic workflow file path or name", "default")
        .description("Add a new MCP server configuration")
        .allowUnknownOption() // Allow -- separator like Claude CLI
        .action(async (name, commandOrUrl, args, options, command) => {
            try {
                // Handle -- separator by checking if there are unknown options
                const allArgs = process.argv
                const dashDashIndex = allArgs.indexOf("--")
                if (dashDashIndex > -1) {
                    // Everything after -- becomes the command and args
                    const commandParts = allArgs.slice(dashDashIndex + 1)
                    if (commandParts.length > 0) {
                        commandOrUrl = commandParts[0]
                        args = commandParts.slice(1)
                    }
                }
                await mcpAdd(name, commandOrUrl, args, options)
            } catch (error) {
                logError("Failed to add MCP server", error)
                process.exit(1)
            }
        })

    // mcp list command
    mcp
        .command("list")
        .argument("[workflow]", "Agentic workflow file path or name", "default")
        .description("List all configured MCP servers for a workflow")
        .action(async (workflow) => {
            try {
                await mcpList(workflow)
            } catch (error) {
                logError("Failed to list MCP servers", error)
                process.exit(1)
            }
        })

    // mcp get command
    mcp
        .command("get")
        .argument("<name>", "Name of the MCP server")
        .argument("[workflow]", "Agentic workflow file path or name", "default")
        .description("Get details for a specific MCP server")
        .action(async (name, workflow) => {
            try {
                await mcpGet(name, workflow)
            } catch (error) {
                logError("Failed to get MCP server details", error)
                process.exit(1)
            }
        })

    // mcp remove command
    mcp
        .command("remove")
        .argument("<name>", "Name of the MCP server")
        .argument("[workflow]", "Agentic workflow file path or name", "default")
        .description("Remove an MCP server configuration")
        .action(async (name, workflow) => {
            try {
                await mcpRemove(name, workflow)
            } catch (error) {
                logError("Failed to remove MCP server", error)
                process.exit(1)
            }
        })

    // mcp inspect command (moved from the main mcp command)
    mcp
        .command("inspect")
        .argument("[workflow]", "Agentic workflow file path or name", "default")
        .option("--groups <string...>", "Filter script by groups")
        .option("--ids <string...>", "Filter script by ids")
        .option("--startup <string>", "Startup script id, executed after the server is started")
        .description("Inspect MCP server for a workflow")
        .action(async (workflow, options) => {
            try {
                await mcpInspect(workflow, options)
            } catch (error) {
                logError("Failed to inspect MCP server", error)
                process.exit(1)
            }
        })
}
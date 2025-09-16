import { logVerbose, logError } from "../../core/src/util"
import { errorMessage } from "../../core/src/error"
import { setConsoleColors } from "../../core/src/consolecolor"
import debug from "debug"
import { McpClientManager } from "../../core/src/mcpclient"
import type { McpServerConfig } from "../../core/src/types/prompt_template"

const dbg = debug("genaiscript:mcp:inspect")

export interface McpInspectOptions {
    command: string
    args?: string[]
    version?: string
}

/**
 * Inspects an MCP server by connecting to it and listing available tools and resources
 * @param options - Configuration for connecting to the MCP server
 */
export async function inspectMcpServer(options: McpInspectOptions) {
    setConsoleColors(true)
    
    const { command, args = [], version = "1.0.0" } = options
    
    logVerbose(`mcp inspect: connecting to server...`)
    dbg(`command: ${command}, args: ${JSON.stringify(args)}`)
    
    try {
        const manager = new McpClientManager()
        
        try {
            // Create a server config for connecting to the MCP server
            const serverConfig: McpServerConfig = {
                id: "inspect",
                command,
                args,
                version,
            }
            
            // Connect to the MCP server
            const client = await manager.startMcpServer(serverConfig, {
                trace: false,
                traceCategory: "inspect",
                cancellationToken: undefined,
            })
            
            console.log(`\n🔍 Inspecting MCP Server`)
            console.log(`   Command: ${command} ${args.join(' ')}`)
            console.log(`   Version: ${version}\n`)
            
            // List tools
            try {
                console.log("📚 Available Tools:")
                const tools = await client.listTools()
                
                if (tools.length === 0) {
                    console.log("   No tools available")
                } else {
                    for (const tool of tools) {
                        console.log(`   • ${tool.name}`)
                        if (tool.description) {
                            console.log(`     ${tool.description}`)
                        }
                        // Show input schema if available
                        if (tool.inputSchema) {
                            const schema = tool.inputSchema as any
                            if (schema.properties) {
                                const props = Object.keys(schema.properties)
                                if (props.length > 0) {
                                    console.log(`     Parameters: ${props.join(', ')}`)
                                }
                            }
                        }
                        console.log()
                    }
                }
            } catch (error) {
                console.log(`   Error listing tools: ${errorMessage(error)}`)
            }
            
            // List resources
            try {
                console.log("📦 Available Resources:")
                const resources = await client.listResources()
                
                if (resources.length === 0) {
                    console.log("   No resources available")
                } else {
                    for (const resource of resources) {
                        console.log(`   • ${resource.name || resource.uri}`)
                        if (resource.description) {
                            console.log(`     ${resource.description}`)
                        }
                        if (resource.mimeType) {
                            console.log(`     Type: ${resource.mimeType}`)
                        }
                        console.log(`     URI: ${resource.uri}`)
                        console.log()
                    }
                }
            } catch (error) {
                console.log(`   Error listing resources: ${errorMessage(error)}`)
            }
            
            // Clean up
            await client.dispose()
            
        } finally {
            await manager[Symbol.asyncDispose]()
        }
        
        logVerbose(`mcp inspect: completed successfully`)
        
    } catch (error) {
        logError(`mcp inspect: failed to connect to server`)
        logError(errorMessage(error))
        process.exit(1)
    }
}
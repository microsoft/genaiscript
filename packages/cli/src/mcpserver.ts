import debug from "debug"
const dbg = debug("genaiscript:mcp:server")

import { logVerbose, toStringList } from "../../core/src/util"
import { CHANGE, TOOL_ID } from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { ScriptFilterOptions } from "../../core/src/ast"
import { run } from "./api"
import {
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ReadResourceRequestSchema,
    type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "../../core/src/error"
import { setConsoleColors } from "../../core/src/consolecolor"
import { startProjectWatcher } from "./watch"
import { applyRemoteOptions, RemoteOptions } from "./remote"
import { setMcpMode } from "../../core/src/mcp"
import { runtimeHost } from "../../core/src/host"
import { ResourceManager } from "../../core/src/mcpresource"

/**
 * Starts the MCP server.
 *
 * @param options - Configuration options for the server that may include script filtering options and remote settings.
 *    - `options.scriptFilter` - Defines filters to apply to script discovery.
 *    - `options.remote` - Configuration for remote execution and related options.
 *
 * Initializes and sets up the server with appropriate request handlers for listing tools and executing specific tool commands. Monitors project changes through a watcher and updates the tool list when changes occur. Uses a transport layer to handle server communication over standard I/O.
 */
export async function startMcpServer(
    options?: ScriptFilterOptions & RemoteOptions
) {
    setConsoleColors(false)
    logVerbose(`mcp server: starting...`)
    setMcpMode("server")

    await applyRemoteOptions(options)

    const watcher = await startProjectWatcher(options)
    logVerbose(`mcp server: watching ${watcher.cwd}`)
    const { Server } = await import("@modelcontextprotocol/sdk/server/index.js")
    const { StdioServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/stdio.js"
    )
    const { CallToolRequestSchema, ListToolsRequestSchema } = await import(
        "@modelcontextprotocol/sdk/types.js"
    )

    const server = new Server(
        {
            name: TOOL_ID,
            version: CORE_VERSION,
        },
        {
            capabilities: {
                tools: {
                    listChanged: true,
                },
                resources: {
                    listChanged: true,
                },
            },
        }
    )
    watcher.addEventListener("change", async () => {
        logVerbose(`mcp server: tools changed`)
        await server.sendToolListChanged()
    })
    server.setRequestHandler(ListToolsRequestSchema, async (req) => {
        dbg(`fetching scripts from watcher`)
        const scripts = await watcher.scripts()
        const tools = scripts.map((script) => {
            const { id, title, description, inputSchema, accept } = script
            const scriptSchema = inputSchema.properties
                .script as JSONSchemaObject
            if (accept !== "none")
                scriptSchema.properties.files = {
                    type: "array",
                    items: {
                        type: "string",
                        description: "File paths to be passed to the script",
                    },
                }
            return {
                name: id,
                description: toStringList(title, description),
                inputSchema: scriptSchema,
            }
        })
        dbg(`returning tool list with ${tools.length} tools`)
        return { tools }
    })
    server.setRequestHandler(CallToolRequestSchema, async (req) => {
        dbg(`received CallToolRequest with name: ${req.params?.name}`)
        const { name, arguments: args } = req.params
        try {
            const { files, ...vars } = args || {}
            dbg(
                `executing tool: ${name} with files: ${files} and vars: ${JSON.stringify(vars)}`
            )
            const res = await run(name, files as string[], {
                vars: vars as Record<string, any>,
            })
            dbg(`tool execution result: ${JSON.stringify(res)}`)
            return {
                isError: res.status !== "success" || !!res.error,
                content: [
                    {
                        type: "text",
                        text: res?.error?.message || res.text,
                    },
                ],
            } satisfies CallToolResult
        } catch (err) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: errorMessage(err),
                    },
                ],
            } satisfies CallToolResult
        }
    })
    server.setRequestHandler(ListResourcesRequestSchema, async (req) => {
        dbg(`received CallToolRequest with name: ${req.params?.name}`)
        const resources = await runtimeHost.resources.resources()
        return { resources }
    })
    server.setRequestHandler(
        ListResourceTemplatesRequestSchema,
        async (req) => {
            return { templates: [] }
        }
    )
    server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
        const { uri } = req.params
        const resource = await runtimeHost.resources.readResource(uri)
        return { content: resource }
    })

    runtimeHost.resources.addEventListener(CHANGE, async () => {
        await server.sendResourceListChanged()
    })
    runtimeHost.resources.addEventListener(
        ResourceManager.RESOURCE_CHANGE,
        async (e) => {
            const ev = e as CustomEvent<{ uri: string }>
            await server.sendResourceUpdated({ uri: ev.detail.uri })
        }
    )

    const transport = new StdioServerTransport()
    dbg(`connecting server with transport`)
    await server.connect(transport)
}

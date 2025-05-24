import { logVerbose, logWarn } from "../../core/src/util"
import { CHANGE, RESOURCE_CHANGE, TOOL_ID } from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { ScriptFilterOptions } from "../../core/src/ast"
import { run } from "./api"
import {
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ReadResourceRequestSchema,
    type CallToolResult,
    type ListToolsResult,
    type ListResourcesResult,
    type ListResourceTemplatesResult,
    type ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "../../core/src/error"
import { setConsoleColors } from "../../core/src/consolecolor"
import { startProjectWatcher } from "./watch"
import { applyRemoteOptions, RemoteOptions } from "./remote"
import { runtimeHost } from "../../core/src/host"
import { Resource, ResourceContents } from "../../core/src/mcpresource"
import debug from "debug"
import { splitMarkdownTextImageParts } from "../../core/src/markdown"
import { ensureDotGenaiscriptPath } from "../../core/src/workdir"
const dbg = debug("genaiscript:mcp:server")

/**
 * Starts the MCP server.
 *
 * @param options - Configuration options for the server that may include script filtering options, remote settings, and startup script.
 *    - `options.scriptFilter` - Defines filters to apply to script discovery.
 *    - `options.remote` - Configuration for remote execution and related options.
 *    - `options.startup` - Specifies a startup script to run after the server starts.
 *
 * Initializes and sets up the server with appropriate request handlers for listing tools, executing specific tool commands, listing resources, and reading resource contents. Monitors project changes through a watcher and updates the tool list and resource list when changes occur. Uses a transport layer to handle server communication over standard I/O.
 */
export async function startMcpServer(
    options?: ScriptFilterOptions &
        RemoteOptions & {
            startup?: string
        }
) {
    setConsoleColors(false)
    logVerbose(`mcp server: starting...`)

    await ensureDotGenaiscriptPath()
    await applyRemoteOptions(options)
    const { startup } = options || {}

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
        const tools = scripts
            .map((script) => {
                const {
                    id,
                    title,
                    description,
                    inputSchema,
                    accept,
                    annotations = {},
                } = script
                const scriptSchema = (inputSchema?.properties
                    .script as JSONSchemaObject) || {
                    type: "object",
                    properties: {},
                }
                if (accept !== "none")
                    scriptSchema.properties.files = {
                        type: "array",
                        items: {
                            type: "string",
                            description: `Filename or globs relative to the workspace used by the script.${accept ? ` Accepts: ${accept}` : ""}`,
                        },
                    }
                if (!description) logWarn(`script ${id} has no description`)
                return {
                    name: id,
                    description,
                    inputSchema:
                        scriptSchema as ListToolsResult["tools"][0]["inputSchema"],
                    annotations: {
                        ...annotations,
                        title,
                    },
                } satisfies ListToolsResult["tools"][0]
            })
            .filter((t) => !!t)
        dbg(`returning tool list with ${tools.length} tools`)
        return { tools } satisfies ListToolsResult
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
                runTrace: false,
                outputTrace: false,
            })
            dbg(`res: %s`, res.status)
            if (res.error) dbg(`error: %O`, res.error)
            const isError = res.status !== "success" || !!res.error
            const text = res?.error?.message || res.text || ""
            dbg(`inlining images`)
            const parts = await splitMarkdownTextImageParts(text, {
                dir: res.env.runDir,
                convertToDataUri: true,
            })
            dbg(`parts: %O`, parts)
            return {
                isError,
                content: parts,
            } satisfies CallToolResult
        } catch (err) {
            dbg("%O", err)
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
        dbg(`list resources`)
        const resources = await runtimeHost.resources.resources()
        dbg(`found ${resources.length} resources`)
        return {
            resources: resources.map(
                (r) => r as ListResourcesResult["resources"][0]
            ),
        } satisfies ListResourcesResult
    })
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
        dbg(`list resource templates - not supported`)
        return { resourceTemplates: [] } satisfies ListResourceTemplatesResult
    })
    server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
        const { uri } = req.params
        dbg(`read resource: ${uri}`)
        const resource: ResourceContents =
            await runtimeHost.resources.readResource(uri)
        if (!resource) dbg(`resource not found: ${uri}`)
        return resource as ReadResourceResult
    })
    runtimeHost.resources.addEventListener(CHANGE, async () => {
        await server.sendResourceListChanged()
    })
    runtimeHost.resources.addEventListener(RESOURCE_CHANGE, async (e) => {
        const ev = e as CustomEvent<Resource>
        await server.sendResourceUpdated({
            uri: ev.detail.reference.uri,
        })
    })

    const transport = new StdioServerTransport()
    dbg(`connecting server with transport`)
    await server.connect(transport)

    if (startup) {
        logVerbose(`startup script: ${startup}`)
        await run(startup, [], {
            vars: {},
            onMessage: async (data) => {
                if (data.type === RESOURCE_CHANGE) {
                    await runtimeHost.resources.upsetResource(
                        data.reference,
                        data.content
                    )
                } else {
                    dbg(`unknown message type: ${data.type}`)
                }
            },
        })
    }
}

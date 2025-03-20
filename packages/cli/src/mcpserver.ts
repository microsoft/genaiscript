import { logVerbose, toStringList } from "../../core/src/util"
import { TOOL_ID } from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { ScriptFilterOptions } from "../../core/src/ast"
import { run } from "./api"
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "../../core/src/error"
import { setConsoleColors } from "../../core/src/consolecolor"
import { startProjectWatcher } from "./watch"

export async function startMcpServer(options?: ScriptFilterOptions) {
    setConsoleColors(false)
    logVerbose(`mcp server: starting...`)
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
            },
        }
    )
    watcher.addEventListener("change", async () => {
        logVerbose(`mcp server: tools changed`)
        await server.sendToolListChanged()
    })
    server.setRequestHandler(ListToolsRequestSchema, async (req) => {
        const scripts = await watcher.scripts()
        const tools = scripts.map((script) => {
            const { id, title, description, inputSchema } = script
            return {
                name: id,
                description: toStringList(title, description),
                inputSchema: {
                    type: "object",
                    properties: {
                        files: {
                            type: "array",
                            items: {
                                type: "string",
                                description:
                                    "File paths to be passed to the script",
                            },
                        },
                        ...(inputSchema.properties || {}),
                    },
                    required: inputSchema.required || [],
                },
            }
        })
        return { tools }
    })
    server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const { name, arguments: args } = req.params
        try {
            const { files, ...vars } = args || {}
            const res = await run(name, files as string[], {
                vars: vars as Record<string, any>,
            })
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

    const transport = new StdioServerTransport()
    await server.connect(transport)
}

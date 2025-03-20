import { TraceOptions } from "../../core/src/trace"
import { logError, logVerbose, toStringList } from "../../core/src/util"
import { TOOL_ID } from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { filterScripts, ScriptFilterOptions } from "../../core/src/ast"
import z from "zod"
import { run } from "./api"
import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "../../core/src/error"
import { buildProject } from "./build"

export async function startMcpServer(
    options?: ScriptFilterOptions & { sse?: boolean }
) {
    logVerbose(`mcp server: starting...`)
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
                tools: {},
            },
        }
    )
    server.setRequestHandler(ListToolsRequestSchema, async (req) => {
        const prj = await buildProject() // Build the project to get script templates
        const scripts = filterScripts(prj.scripts, options)
        const tools = scripts.map((script) => {
            const { id, title, description, inputSchema } = script
            return {
                name: id,
                description: toStringList(title, description),
                inputSchema: inputSchema,
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

import { TraceOptions } from "../../core/src/trace"
import { logError, logVerbose, toStringList } from "../../core/src/util"
import { TOOL_ID } from "../../core/src/constants"
import { CORE_VERSION } from "../../core/src/version"
import { Project } from "../../core/src/server/messages"
import { filterScripts, ScriptFilterOptions } from "../../core/src/ast"
import z from "zod"
import { CancellationOptions } from "../../core/src/cancellation"
import { run } from "./api"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { errorMessage } from "../../core/src/error"
import { buildProject } from "./build"

function promptParameterTypeToZodType(
    p: PromptParameterType
): z.ZodType<any, any> {
    if (typeof p === "string") return z.string().optional()
    if (typeof p === "number") return z.number().optional()
    if (typeof p === "boolean") return z.boolean().optional()
    if (typeof p === "object") {
        const { type } = p as PromptJSONParameterType<any>
        if (type === "string") return z.string().optional()
        if (type === "number") return z.number().optional()
        if (type === "boolean") return z.boolean().optional()
    }
    return z.any().optional()
}

export async function startMcpServer(options?: ScriptFilterOptions) {
    const prj = await buildProject() // Build the project to get script templates
    const scripts = filterScripts(prj.scripts, options)

    logVerbose(`mcp server: starting...`)
    const { McpServer } = await import(
        "@modelcontextprotocol/sdk/server/mcp.js"
    )
    const { StdioServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/stdio.js"
    )
    const server = new McpServer(
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
    for (const script of scripts) {
        registerScriptAsTool(script)
    }
    const transport = new StdioServerTransport()
    await server.connect(transport)

    function registerScriptAsTool(script: PromptScript) {
        const { id, title, description, parameters } = script
        const args = parametersToZod(parameters)
        server.tool(
            id,
            toStringList(title, description),
            args,
            async (args, extra) => {
                logVerbose(`mcp server: run ${id}...`)
                try {
                    const { files, ...params } = args || {}
                    const res = await run(id, files, {
                        vars: params,
                    })
                    return {
                        isError: res.status !== "success" || !!res.error,
                        content: [
                            {
                                type: "text",
                                content: res?.error || res.text,
                            },
                        ],
                    } satisfies CallToolResult
                } catch (err) {
                    logError(err)
                    return {
                        isError: true,
                        content: [
                            {
                                type: "text",
                                content: errorMessage(err),
                            },
                        ],
                    } satisfies CallToolResult
                }
            }
        )
    }
}

function parametersToZod(parameters: PromptParametersSchema) {
    if (!parameters) return {}
    const fields = Object.entries(parameters).map(([name, type]) => [
        name,
        Array.isArray(type)
            ? z.array(promptParameterTypeToZodType(type[0]))
            : promptParameterTypeToZodType(type),
    ])
    const args: z.ZodRawShape = Object.fromEntries([
        ["files", z.array(z.string()).optional()],
        ...fields,
    ])
    return args
}

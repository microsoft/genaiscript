import debug from "debug"
const dbg = debug("genaiscript:mcpclient")

import { TraceOptions } from "./trace"
import { arrayify, logVerbose } from "./util"
import type {
    TextContent,
    ImageContent,
    EmbeddedResource,
} from "@modelcontextprotocol/sdk/types.js"

/**
 * Initializes and starts an MCP client based on the provided server configuration and options.
 *
 * @param serverConfig - Configuration for the MCP server, including:
 *   - id: The identifier for the server.
 *   - version: The version of the client (defaults to "1.0.0").
 *   - params: Optional parameters for the client.
 *   - rest: Additional configuration properties for the server.
 * @param options - Trace options containing tracing utilities to monitor and log client activities.
 * @returns An object containing:
 *   - tools: A list of tool callbacks provided by the server.
 *   - Symbol.asyncDispose: A method to clean up resources (close client and transport) when the client is no longer needed.
 */
export async function startMcpClient(
    serverConfig: McpServerConfig,
    options: TraceOptions
): Promise<{ tools: ToolCallback[] } & AsyncDisposable> {
    const { id, version = "1.0.0", params = [], ...rest } = serverConfig
    logVerbose(`mcp: starting ${id}`)
    const trace = options.trace.startTraceDetails(`🪚 mcp ${id}`)
    try {
        const { Client } = await import(
            "@modelcontextprotocol/sdk/client/index.js"
        )
        const { StdioClientTransport } = await import(
            "@modelcontextprotocol/sdk/client/stdio.js"
        )

        const capabilities = { tools: {} }
        const transport = new StdioClientTransport({
            ...rest,
            stderr: "inherit",
        })
        const client = new Client(
            { name: id, version, params },
            { capabilities }
        )
        dbg(`connecting client to transport`)
        await client.connect(transport)

        // list tools
        dbg(`listing tools from client`)
        const { tools: toolDefinitions } = await client.listTools()
        trace.fence(
            toolDefinitions.map(({ name, description }) => ({
                name,
                description,
            })),
            "json"
        )
        const tools = toolDefinitions.map(
            ({ name, description, inputSchema }) =>
                ({
                    spec: {
                        name: `${id}_${name}`,
                        description,
                        parameters: inputSchema as any,
                    },
                    impl: async (args: any) => {
                        const { context, ...rest } = args
                        const res = await client.callTool({
                            name: name,
                            arguments: rest,
                        })
                        const content = res.content as (
                            | TextContent
                            | ImageContent
                            | EmbeddedResource
                        )[]
                        let text = arrayify(content)
                            ?.map((c) => {
                                switch (c.type) {
                                    case "text":
                                        return c.text || ""
                                    case "image":
                                        return c.data
                                    case "resource":
                                        return c.resource?.uri || ""
                                    default:
                                        return c
                                }
                            })
                            .join("\n")
                        if (res.isError) {
                            dbg(`tool error: ${text}`)
                            text = `Tool Error\n${text}`
                        }
                        return text
                    },
                }) satisfies ToolCallback
        )
        return {
            tools,
            [Symbol.asyncDispose]: async () => {
                logVerbose(`mcp: closing ${id}`)
                await client.close()
                await transport.close()
            },
        }
    } finally {
        trace.endDetails()
    }
}

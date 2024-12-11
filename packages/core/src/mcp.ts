import { TraceOptions } from "./trace"
import { arrayify, logVerbose } from "./util"
import type {
    TextContent,
    ImageContent,
    EmbeddedResource,
} from "@modelcontextprotocol/sdk/types.js"

export async function startMcpServer(
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
        await client.connect(transport)

        // list tools
        const { tools: toolDefinitions } = await client.listTools()
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
                        if (res.isError) text = `Tool Error\n${text}`
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

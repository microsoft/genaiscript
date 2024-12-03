import { TraceOptions } from "./trace"

export async function startMcpServer(
    serverConfig: McpServerConfig,
    options: TraceOptions
): Promise<{ tools: ToolCallback[] } & AsyncDisposable> {
    const trace = options.trace.startTraceDetails(`🪚 mcp ${name}`)
    try {
        const { Client } = await import(
            "@modelcontextprotocol/sdk/client/index.js"
        )
        const { StdioClientTransport } = await import(
            "@modelcontextprotocol/sdk/client/stdio.js"
        )

        const capabilities = { tools: {} }
        const { id, version = "1.0.0", params = [], ...rest } = serverConfig
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
                        const { content, ...rest } = args
                        const res = await client.callTool({
                            name: name,
                            arguments: rest,
                        })
                        return (res.content as { text?: string }[])
                            .map((c) => c.text)
                            .join("\n")
                    },
                }) satisfies ToolCallback
        )
        return {
            tools,
            [Symbol.asyncDispose]: async () => {
                await client.close()
                await transport.close()
            },
        }
    } finally {
        trace.endDetails()
    }
}

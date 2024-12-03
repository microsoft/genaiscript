import { uniqBy } from "es-toolkit"
import { TraceOptions } from "./trace"
import { logError } from "./util"
import { trace } from "console"

export async function startMcpServers(
    servers: McpServerConfig[],
    options?: TraceOptions
): Promise<{ dispose: (options?: TraceOptions) => Promise<void> }> {
    servers = uniqBy(servers || [], (s) => s.id)
    if (!servers.length)
        return { dispose: async (options?: TraceOptions) => {} }

    const disposers = await Promise.all(
        servers.map((s) => startMcpServer(s.id, s, options))
    )
    return {
        dispose: async (options) => {
            const { trace } = options || {}
            for (const disposer of disposers) {
                try {
                    await disposer.dispose()
                } catch (e) {
                    logError(e)
                    trace.error(e)
                }
            }
        },
    }
}

async function startMcpServer(
    name: string,
    serverConfig: McpServerConfig,
    options: TraceOptions
) {
    const trace = options.trace.startTraceDetails(`🪚 mcp ${name}`)
    try {
        const { Client } = await import(
            "@modelcontextprotocol/sdk/client/index.js"
        )
        const { StdioClientTransport } = await import(
            "@modelcontextprotocol/sdk/client/stdio.js"
        )

        const capabilities = { tools: {} }
        const { version = "1.0.0", params = [], ...rest } = serverConfig
        const transport = new StdioClientTransport({
            ...rest,
            stderr: "inherit",
        })
        const client = new Client({ name, version, params }, { capabilities })
        await client.connect(transport)

        // list tools
        const { tools } = await client.listTools()
        for (const tool of tools) {
            //console.debug(`mcp: tool ${tool.name}`)
            defTool(
                `${name}_${tool.name}`,
                tool.description,
                tool.inputSchema as any,
                async (args: any) => {
                    const { content, ...rest } = args
                    const res = await client.callTool({
                        name: tool.name,
                        arguments: rest,
                    })
                    return (res.content as { text?: string }[])
                        .map((c) => c.text)
                        .join("\n")
                }
            )
        }

        return {
            dispose: async () => {
                await client.close()
                await transport.close()
            },
        }
    } finally {
        trace.endDetails()
    }
}

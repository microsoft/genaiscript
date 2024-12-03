script({
    description: "Model Context Protocol server demo",
})

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

interface McpServerConfig extends Omit<StdioServerParameters, "stderr"> {
    version?: string
    params?: Record<string, any>
}
type McpServersConfig = Record<string, McpServerConfig>

async function startMcpServer(name: string, serverConfig: McpServerConfig) {
    console.debug(`mcp: starting '${name}' server`)

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
}

async function startMcpServers(config: McpServersConfig) {
    await Promise.all(
        Object.entries(config).map(
            async ([name, serverConfig]) =>
                await startMcpServer(name, serverConfig)
        )
    )
}

await startMcpServers({
    memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
    },
    filesystem: {
        command: "npx",
        args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            path.resolve("."),
        ],
    },
})

$`Summarize the README.md file at the root of the workspace.`

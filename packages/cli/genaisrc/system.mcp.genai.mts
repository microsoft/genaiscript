system({
    title: "Loads tools from Model Context Protocol server",
    description:
        "This system script should be configured with a MCP server configuration.",
    parameters: {
        id: {
            type: "string",
            description: "The unique identifier for the MCP server.",
            required: true,
        },
        command: {
            type: "string",
            description: "The command to run the MCP server.",
            required: true,
        },
        args: {
            type: "array",
            items: { type: "string" },
            description: "The arguments to pass to the command.",
        },
        params: {
            type: "array",
            items: { type: "string" },
            description: "The parameters to pass to the command.",
        },
        version: {
            type: "string",
            description: "The version of the MCP server.",
        },
    },
})

export default function (ctx: ChatGenerationContext) {
    const { env, defTool } = ctx
    const { vars } = env
    const dbg = host.logger("genaiscript:mcp:system")

    const id = vars["system.mcp.id"] as string
    const command = vars["system.mcp.command"] as string
    const args = (vars["system.mcp.args"] as string[]) || []
    const params = (vars["system.mcp.params"] as string[]) || []
    const version = vars["system.mcp.version"] as string

    if (!id) throw new Error("Missing required parameter: id")
    if (!command) throw new Error("Missing required parameter: command")

    dbg(`loading %s %O`, id, { command, args, params, version })
    const configs = {
        [id]: {
            command,
            args,
            params,
            version,
        },
    } satisfies McpServersConfig
    defTool(configs)
}

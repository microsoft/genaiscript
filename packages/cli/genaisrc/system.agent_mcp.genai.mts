system({
    title: "Model Context Protocol Agent",
    description: "Wraps a MCP server with an agent.",
    parameters: {
        description: {
            type: "string",
            description: "Description of the MCP server and agent.",
            required: true,
        },
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
        instructions: {
            type: "string",
            description:
                "Instructions for the agent on how to use the MCP server.",
        },
    },
})

export default function (ctx: ChatGenerationContext) {
    const { env, defAgent } = ctx
    const { vars } = env
    const dbg = host.logger("genaiscript:mcp:agent")

    const id = vars["system.agent_mcp.id"] as string
    const description = vars["system.agent_mcp.description"] as string
    const command = vars["system.agent_mcp.command"] as string
    const args = (vars["system.agent_mcp.args"] as string[]) || []
    const params = (vars["system.agent_mcp.params"] as string[]) || []
    const version = vars["system.agent_mcp.version"] as string
    const instructions = vars["system.agent_mcp.instructions"] as string

    if (!id) throw new Error("Missing required parameter: id")
    if (!description) throw new Error("Missing required parameter: description")
    if (!command) throw new Error("Missing required parameter: command")

    const configs = {
        [id]: {
            command,
            args,
            params,
            version,
        },
    } satisfies McpServersConfig
    dbg(`loading %s %O`, id, { command, args, params, version })
    defAgent(
        id,
        description,
        async (agentCtx) => {
            dbg("defining agent %s", id)
            agentCtx.defTool(configs)
            if (instructions) agentCtx.$`${instructions}`.role("system")
        },
        {
            system: [
                "system",
                "system.tools",
                "system.explanations",
                "system.assistant",
            ],
        }
    )
}

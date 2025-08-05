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
            description: "The command to run the MCP server. Required for stdio transport.",
        },
        args: {
            type: "array",
            items: { type: "string" },
            description: "The arguments to pass to the command. Used with stdio transport.",
        },
        url: {
            type: "string",
            description: "URL for HTTP/WebSocket/SSE transports. Required for URL-based transports.",
        },
        type: {
            type: "string",
            enum: ["stdio", "http", "sse"],
            description: "Transport type specification. If not specified, will be inferred from provided parameters.",
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
        maxTokens: {
            type: "integer",
            minimum: 16,
            description: "Maximum number of tokens returned by the tools.",
        },
        toolsSha: {
            type: "string",
            description:
                "The SHA256 hash of the tools returned by the MCP server.",
        },
        contentSafety: {
            type: "string",
            description: "Content safety provider",
            enum: ["azure"],
        },
        detectPromptInjection: {
            anyOf: [
                { type: "string" },
                { type: "boolean", enum: ["always", "available"] },
            ],
            description:
                "Whether to detect prompt injection attacks in the MCP server.",
        },
        intent: {
            type: "any",
            description: "the intent of the tools",
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
    const url = vars["system.agent_mcp.url"] as string
    const type = vars["system.agent_mcp.type"] as "stdio" | "http" | "sse"
    const version = vars["system.agent_mcp.version"] as string
    const instructions = vars["system.agent_mcp.instructions"] as string
    const maxTokens = vars["system.agent_mcp.maxTokens"] as number
    const toolsSha = vars["system.mcp.toolsSha"] as string
    const contentSafety = vars[
        "system.mcp.contentSafety"
    ] as ContentSafetyOptions["contentSafety"]
    const detectPromptInjection = vars[
        "system.mcp.detectPromptInjection"
    ] as ContentSafetyOptions["detectPromptInjection"]
    const intent = vars["system.mcp.intent"]

    if (!id) throw new Error("Missing required parameter: id")
    if (!description) throw new Error("Missing required parameter: description")

    // Determine transport type if not explicitly provided
    let transportType = type
    if (!transportType) {
        if (url) {
            transportType = "http" // Default to HTTP for URL-based configs
        } else if (command) {
            transportType = "stdio"
        }
    }

    // Validate configuration based on transport type  
    if (transportType === "stdio" || (!url && command)) {
        if (!command) throw new Error("Missing required parameter: command (for stdio transport)")
    } else if (transportType === "http" || transportType === "sse" || url) {
        if (!url) throw new Error("Missing required parameter: url (for HTTP/SSE transport)")
        if (command) throw new Error("Cannot specify both 'command' and 'url' parameters")
    } else {
        throw new Error("Must provide either 'command' (for stdio transport) or 'url' (for HTTP/SSE transport)")
    }

    const configs = {
        [id]: {
            command,
            args,
            url,
            type: transportType,
            version,
            toolsSha,
            contentSafety,
            detectPromptInjection,
            intent,
        },
    } satisfies McpServersConfig
    const toolOptions = {
        maxTokens,
        contentSafety,
        detectPromptInjection,
    } satisfies DefToolOptions
    dbg(`loading %s %O %O`, id, configs, toolOptions)
    defAgent(
        id,
        description,
        async (agentCtx) => {
            dbg("defining agent %s", id)
            agentCtx.defTool(configs, toolOptions)
            if (instructions) agentCtx.$`${instructions}`.role("system")
        },
        {
            ...toolOptions,
            system: [
                "system",
                "system.tools",
                "system.explanations",
                "system.assistant",
            ],
        }
    )
}

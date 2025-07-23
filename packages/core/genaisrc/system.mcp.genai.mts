system({
    title: "Loads tools from Model Context Protocol server",
    description:
        "This system script can be configured with a MCP server configuration or reference a server by ID from mcp.json files.",
    parameters: {
        id: {
            type: "string",
            description: "The unique identifier for the MCP server. If only this is provided, the server configuration will be resolved from mcp.json files.",
            required: true,
        },
        command: {
            type: "string",
            description: "The command to run the MCP server. If not provided, the configuration will be resolved from mcp.json files using the server ID.",
            required: false,
        },
        args: {
            type: "array",
            items: { type: "string" },
            description: "The arguments to pass to the command.",
        },
        version: {
            type: "string",
            description: "The version of the MCP server.",
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
    const { env, defTool } = ctx
    const { vars } = env
    const dbg = host.logger("genaiscript:mcp:system")

    const id = vars["system.mcp.id"] as string
    const command = vars["system.mcp.command"] as string
    const args = (vars["system.mcp.args"] as string[]) || []
    const version = vars["system.mcp.version"] as string
    const maxTokens = vars["system.mcp.maxTokens"] as number
    const toolsSha = vars["system.mcp.toolsSha"] as string
    const contentSafety = vars[
        "system.mcp.contentSafety"
    ] as ContentSafetyOptions["contentSafety"]
    const detectPromptInjection = vars[
        "system.mcp.detectPromptInjection"
    ] as ContentSafetyOptions["detectPromptInjection"]
    const intent = vars["system.mcp.intent"]
    const _env = vars["system.mcp.env"] as Record<string, string> | undefined
    
    if (!id) throw new Error("Missing required parameter: id")

    let resolvedCommand = command
    let resolvedArgs = args
    let resolvedEnv = _env

    // If command is not provided, try to resolve from mcp.json files
    if (!command) {
        dbg(`resolving server configuration for id: ${id}`)
        const { resolveMcpServerById, listAvailableMcpServers } = await import("../src/mcpresolver.js")
        
        const resolved = resolveMcpServerById(id)
        if (!resolved) {
            const available = listAvailableMcpServers()
            const availableText = available.length > 0 
                ? `Available servers: ${available.join(", ")}`
                : "No servers found in mcp.json files"
            throw new Error(`MCP server "${id}" not found in mcp.json files. ${availableText}`)
        }
        
        resolvedCommand = resolved.command
        resolvedArgs = resolved.args || []
        resolvedEnv = { ...resolved.env, ..._env } // Allow override from vars
        
        dbg(`resolved server "${id}": command=${resolvedCommand}, args=${JSON.stringify(resolvedArgs)}`)
    }

    if (!resolvedCommand) throw new Error(`Missing command for MCP server "${id}"`)

    const config = {
        command: resolvedCommand,
        args: resolvedArgs,
        version,
        toolsSha,
        contentSafety,
        detectPromptInjection,
        intent,
        env: resolvedEnv,
    } satisfies Omit<McpServerConfig, "id">
    const toolOptions = {
        maxTokens,
        contentSafety,
        detectPromptInjection,
    } satisfies DefToolOptions
    const configs = {
        [id]: config,
    } satisfies McpServersConfig
    defTool(configs, toolOptions)
}

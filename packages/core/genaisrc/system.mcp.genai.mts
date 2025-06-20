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
    if (!command) throw new Error("Missing required parameter: command")

    const config = {
        command,
        args,
        version,
        toolsSha,
        contentSafety,
        detectPromptInjection,
        intent,
        env: _env,
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

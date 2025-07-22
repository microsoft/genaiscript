system({
    title: "Loads tools from Model Context Protocol server",
    description: "This system script should be configured with a MCP server configuration.",
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
            description: "The SHA256 hash of the tools returned by the MCP server.",
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
            description: "Whether to detect prompt injection attacks in the MCP server.",
        },
        intent: {
            type: "any",
            description: "the intent of the tools",
        },
    },
});
export default function (ctx) {
    var _a;
    var env = ctx.env, defTool = ctx.defTool;
    var vars = env.vars;
    var dbg = host.logger("genaiscript:mcp:system");
    var id = vars["system.mcp.id"];
    var command = vars["system.mcp.command"];
    var args = vars["system.mcp.args"] || [];
    var version = vars["system.mcp.version"];
    var maxTokens = vars["system.mcp.maxTokens"];
    var toolsSha = vars["system.mcp.toolsSha"];
    var contentSafety = vars["system.mcp.contentSafety"];
    var detectPromptInjection = vars["system.mcp.detectPromptInjection"];
    var intent = vars["system.mcp.intent"];
    var _env = vars["system.mcp.env"];
    if (!id)
        throw new Error("Missing required parameter: id");
    if (!command)
        throw new Error("Missing required parameter: command");
    var config = {
        command: command,
        args: args,
        version: version,
        toolsSha: toolsSha,
        contentSafety: contentSafety,
        detectPromptInjection: detectPromptInjection,
        intent: intent,
        env: _env,
    };
    var toolOptions = {
        maxTokens: maxTokens,
        contentSafety: contentSafety,
        detectPromptInjection: detectPromptInjection,
    };
    var configs = (_a = {},
        _a[id] = config,
        _a);
    defTool(configs, toolOptions);
}

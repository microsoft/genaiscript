import debug from "debug"
const dbg = debug("genaiscript:mcp")
export let mcpMode: "server" | "client" = undefined

export function setMcpMode(mode: "server" | "client") {
    if (mcpMode && mcpMode !== mode) {
        throw new Error(
            `MCP mode already set to ${mcpMode}. Cannot change to ${mode}`
        )
    }
    mcpMode = mode
    dbg(`mode: ${mode}`)
}

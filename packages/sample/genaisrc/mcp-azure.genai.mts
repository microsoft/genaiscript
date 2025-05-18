const azure = await host.mcpServer({
    id: "azure",
    command: "npx",
    args: ["-y", "@azure/mcp@latest", "server", "start"],
})

const azTools = await azure.listTools()
console.log(`azure: tools: ${azTools.map((t) => t.name).join("\n")}`)
const subs = await azure.callTool("azmcp-subscription-list", {})
console.log(subs)
console.log(`azure: subscriptions: ${subs.text}`)

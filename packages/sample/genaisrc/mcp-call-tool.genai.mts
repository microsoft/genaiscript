script({ model: "echo", tests: {}  })
const fs = await host.mcpServer({
    id: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", path.resolve(".")],
})

const tools = await fs.listTools()
console.log(`mcp: tools: ${tools.map((t) => t.name).join("\n")}`)
const tool = tools.find((t) => t.name === "get_file_info")
console.log(tool.inputSchema)
const res = await fs.callTool("get_file_info", { path: "README.md" })
console.log(res)

script({
    title: "MCP Example Script",
    description: "Demonstrates how to expose a GenAIScript as a Model Context Protocol (MCP) tool and consume MCP tools as a client.",
    group: "mcp",
    parameters: {
        task: {
            type: "string",
            description: "A task to perform using the MCP tool.",
            required: true
        }
    },
    annotations: {
        readOnlyHint: true,
        openWorldHint: true
    },
    mcpServers: {
        memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"]
        }
    }
})

const { task } = env.vars

// Example: Use the MCP memory server tool
const memoryTool = tools.memory_store || tools["memory_store"]
if (memoryTool) {
    const storeRes = await memoryTool({ key: "task", value: task })
    $`Stored task in memory: ${JSON.stringify(storeRes)}`
} else {
    $`No memory tool available. Task: ${task}`
}

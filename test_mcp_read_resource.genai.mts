script({
    title: "Test MCP Read Resource System Script",
    description: "Test script to validate the new mcp_read_resource system tool",
    model: "echo",
    system: ["system.mcp_read_resource"],
})

// Test with a simple URL that should resolve
const url = "https://raw.githubusercontent.com/microsoft/genaiscript/main/README.md"

$`Use the mcp_read_resource tool to read the content from this URL: ${url}`
$`Return only a brief summary of what was read (first few lines).`
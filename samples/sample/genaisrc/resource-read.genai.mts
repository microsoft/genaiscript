script({
    title: "MCP Read Resource System Script",
    description: "Test script to validate the new mcp_read_resource system tool",
    system: ["system.resource_read"],
})

// Test the mcp_read_resource tool with a simple URL
const url = "https://raw.githubusercontent.com/microsoft/genaiscript/main/package.json"

$`I need to read the content from this URL: ${url}`
$`Please use the mcp_read_resource tool to fetch and show me the first few lines of the content.`
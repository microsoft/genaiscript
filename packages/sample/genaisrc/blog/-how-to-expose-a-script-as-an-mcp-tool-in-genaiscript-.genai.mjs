script({
    title: "MCP Example: Exposing a Script as a Model Context Protocol Tool",
    description: "This script demonstrates how to expose a GenAIScript script as a Model Context Protocol (MCP) tool, including parameters, output, and annotations.",
    group: "mcp",
    parameters: {
        input: {
            type: "string",
            description: "Input for the MCP tool.",
            required: true
        }
    },
    annotations: {
        readOnlyHint: true,
        openWorldHint: true
    }
})

const { input } = env.vars

// Optionally, publish a resource that will be available via MCP
const resourceId = await host.publishResource("Echoed input", input)

// Output the result using env.output or top-level context
output.fence(`Echo: ${input}\nResource URI: ${resourceId}`)
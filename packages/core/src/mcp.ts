/*
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface McpServer {
        close(): Promise<void>
}

const transport = new StdioClientTransport({
  command: "path/to/server",
});

const client = new Client({
  name: "example-client",
  version: "1.0.0",
}, {
  capabilities: {}
});

await client.connect(transport);


// List available resources
const rest = await client.listTools()
for await (const tool of rest.tools) 
{   

}
const res = await client.callTool({
    name: "fff",
    arguments: {
        "ff": null
    }
})
*/

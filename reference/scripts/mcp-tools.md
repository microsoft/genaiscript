import { Image } from "astro:assets"
import logoPng from "../../../../assets/mcp.png"
import logoPngTxt from "../../../../assets/mcp.png.txt?raw"

<Image src={logoPng} alt={logoPngTxt} />

[Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is an emerging standard
for portable tool definitions.

The MCP defines a protocol that allows to share [tools](https://modelcontextprotocol.io/docs/concepts/tools)
and consume them regardless of the underlying framework/runtime.

**GenAIScript implements a client for MCP tools**.

## Configuring servers

You can use [defTool](/genaiscript/reference/scripts/tools) to declare a set of server configurations,
using the same syntax as in the [Claude configuration file](https://github.com/modelcontextprotocol/servers?tab=readme-ov-file#using-an-mcp-client).

```js
defTool({
    memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
    },
    filesystem: {
        command: "npx",
        args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            path.resolve("."),
        ],
    },
})
```

GenAIScript will launch the server and register all the tools listed by the server.
The tool identifier will be `server_toolname` to avoid clashes.

## Lifecycle of servers

Servers are started when rendering the prompt and stopped once the chat session is completed.

This means that if you define servers in an [inline prompt](/genaiscript/reference/scripts/inline-prompts),
the server will be started/stopped for each inline prompt.

## Finding servers

The list of available servers can be found in the [Model Context Protocol Servers project](https://github.com/modelcontextprotocol/servers).
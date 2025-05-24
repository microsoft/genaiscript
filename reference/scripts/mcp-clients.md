The [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) defines a protocol for sharing [tools](https://modelcontextprotocol.io/docs/concepts/tools)
and consuming them regardless of the underlying framework or runtime.

GenAIScript enables you to start and interact programmatically with a Model Context Protocol (MCP) server,
invoke tools, and resolve resources. While this is typically reserved for LLM orchestration, it can also be useful to use JavaScript to make a few calls to servers
before making a request.

This functionality is provided as a thin layer above the MCP TypeScript SDK.

## But why not just use APIs?

Choose the best tool for the job. In many cases, APIs are easier, lighter, and faster to use than MCPs, and you can leverage
the power of Node.js to do almost anything.

However, MCPs are APIs packaged for easy consumption by LLM clients. Their authors have designed them to be easy to use and relevant when working with LLMs.

For example, when consuming Python tools from GenAIScript, you might encounter issues with Python runtime or package versioning
if you try to run them directly (and it may be insecure). With MCPs, there is often a containerized version of the tool that is ready to use.

## Starting a Server

You start a server using the same syntax as MCP configuration files, but you must provide an identifier for the server.
This identifier is used to reference the server in the `mcpClient`.

```js
const fs = await host.mcpServer({
    id: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", path.resolve(".")],
})
```

The server is automatically stopped when the prompt finishes.

## Tools

You can perform operations on tools. Queries are not cached and always communicate with the server.

- List tools:

    ```js
    const tools = await fs.listTools()
    ```

- Call a tool:

    ```js
    const res = await fs.callTool("get_file_info", { path: "README.md" })
    ```

- Use the result:

    ```js
    const info = res.content[0].text
    ```

The structure of the output depends on the tool, but it is designed to be consumed by an LLM. You will likely want to use `def` to store it in your prompt:

```js
def("INFO", info)
```

## Example: YouTube Transcript

The [mcp/youtube-transcript](https://hub.docker.com/r/mcp/youtube-transcript) MCP server can extract the transcript
of a YouTube video. It is listed in the [Docker MCP Catalog](https://hub.docker.com/u/mcp).

```js
const yt = await host.mcpServer({
    id: "youtube_transcript",
    command: "docker",
    args: ["run", "-i", "--rm", "mcp/youtube-transcript"],
})

const url = "https://youtu.be/ENunZe--7j0"
const transcript = await yt.callTool("get_transcript", { url })
console.log(`transcript: ${transcript.text}`)
```
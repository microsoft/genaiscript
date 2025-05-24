import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

GenAIScript added a few feature to secure Model Context Protocol (MCP) tools and mitigate specific attacks such as rug pull, tool poisoning, or prompt injection.

Starting with `v1.127`, you can configure the following options as [documented here](/genaiscript/reference/scripts/mcp-tools#security):

- tools signature hash to prevent rug pull attacks, where the list of tools is modified without your knowledge.

```js 'toolsSha: "..."'
script({
    mcpServers: {
        playwright: {
            ...,
            toolsSha: "..."
        }
    }
})
```

- prompt injection detect using [content safety scanner](/genaiscript/reference/scripts/content-safety). This will scan both the tools definition file, to prevent **tool poisoning** and every tool output,
  to prevent **prompt injection**.

```js 'detectPromptInjection: "always"'
script({
    mcpServers: {
        playwright: {
            ...,
            detectPromptInjection: "always"
        }
    }
})
```

- in fact, every tool can be instrumented with content safety scanning.

```js 'detectPromptInjection: "always"'
defTool("fetch", "Fetch a URL", { url: { type: "string" }, },
    async args => ..., {
    detectPromptInjection: "always"
})
```

### Are we done?

There are still many other security aspects to consider when using MCP tools, these features are just a few of them.
import { Code } from "@astrojs/starlight/components"
import { Content as BuiltinTools } from "../../../../components/BuiltinTools.mdx"
import weatherScriptSource from "../../../../../../packages/sample/genaisrc/weather.genai.js?raw"
import mathScriptSource from "../../../../../../packages/sample/genaisrc/math-agent.genai.mjs?raw"
import { YouTube } from "astro-embed"

You can register **tools** (also known as **functions**) that the LLM may decide to call as part of assembling the answer.
See [OpenAI functions](https://platform.openai.com/docs/guides/function-calling), [Ollama tools](https://ollama.com/blog/tool-support),
or [Anthropic tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use).

Not all LLM models support tools, in those cases, GenAIScript also support a fallback mechanism to implement tool call through system prompts (see [Fallback Tools](#fallbacktools)).

<YouTube
    id="https://www.youtube.com/watch?v=E2oBlNK69-c"
    posterQuality="high"
/>

## `defTool`

`defTool` is used to define a tool that can be called by the LLM.
It takes a JSON schema to define the input and expects a string output.
The parameters are defined using the [parameters schema](/genaiscript/reference/scripts/parameters).

**The LLM decides to call this tool on its own!**

```js wrap
defTool(
    "current_weather",
    "get the current weather",
    {
        city: "",
    },
    (args) => {
        const { location } = args
        if (location === "Brussels") return "sunny"
        else return "variable"
    }
)
```

In the example above, we define a tool called `current_weather`
that takes a location as input and returns the weather.

### Weather tool example

This example uses the `current_weather` tool to get the weather for Brussels.

<Code
    code={weatherScriptSource}
    wrap={true}
    lang="js"
    title="weather.genai.mjs"
/>

### Math tool example

This example uses the math expression evaluator
to evaluate a math expression.

<Code
    code={mathScriptSource}
    wrap={true}
    lang="js"
    title="math-agent.genai.mjs"
/>

### Reusing tools in system scripts

You can define tools in a system script and include them in your main script as any other system script or tool.

```js wrap title="system.random.genai.mjs"
system({ description: "Random tools" })

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx
    defTool("random", "Generate a random number", {}, () => Math.random())
}
```

- Make sure to use `system` instead of `script` in the system script.

```js wrap title="random-script.genai.mjs" 'tools: ["random"]'
script({
    title: "Random number",
    tools: ["random"],
})
$`Generate a random number.
```

### Multiple instances of the same system script

You can include the same system script multiple times in a script
with different parameters.

```js wrap
script({
    system: [
        "system.agent_git", // git operations on current repository
        {
            id: "system.agent_git", // same system script
            parameters: { repo: "microsoft/genaiscript" } // but with new parameters
            variant: "genaiscript" // appended to the identifier to keep tool identifiers unique
        }
    ]
})
```

## Model Context Protocol Tools

[Model Context Provider](https://modelcontextprotocol.io/) (MCP) is an open protocol
that enables seamless integration between LLM applications and external data sources and [tools](https://modelcontextprotocol.io/docs/concepts/tools).

You can leverage [MCP servers](https://github.com/modelcontextprotocol/servers) to provide tools to your LLM.

```js
defTool({
    memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
    },
})
```

See [Model Context Protocol Tools](/genaiscript/reference/scripts/mcp-tools) for more information.

## Fallback Tool Support <a href="" id="fallbacktools" />

Some LLM models do not have built-in model support.
For those model, it is possible to enable tool support through system prompts. The performance may be lower than built-in tools, but it is still possible to use tools.

The tool support is implemented in [system.tool_calls](/genaiscript/reference/scripts/system#systemtool_calls)
and "teaches" the LLM how to call tools. When this mode is enabled, you will see
the tool call tokens being responded by the LLM.

GenAIScript maintains a list of well-known models that do not support
tools so it will happen automatically for those models.

To enable this mode, you can either

- add the `fallbackTools` option to the script

```js "fallbackTools: true"
script({
    fallbackTools: true,
})
```

- or add the `--fallback-tools` flag to the CLI

```sh "--fallback-tools"
npx genaiscript run ... --fallback-tools
```

:::note

The performance of this feature will vary greatly based on the LLM model you decide to use.

:::

## Prompt Injection Detection

A tool may retrieve data that contains prompt injection attacks. For example, a tool that fetches a URL may return a page that contains prompt injection attacks.

To prevent this, you can enable the `detectPromptInjection` option. It will run your [content safety scanner](/genaiscript/reference/scripts/content-safety) services
on the tool output and will erase the answer if an attack is detected.

```js 'detectPromptInjection: "always"'
defTool("fetch", "Fetch a URL", {
    url: {
        type: "string",
        description: "The URL to fetch",
    },
}, async (args) => ...,
{
    detectPromptInjection: "always",
})
```

## Output Intent validation

You can configure GenAIScript to execute a LLM-as-a-Judge validation of the tool result based on the description or a custom intent.
The LLM-as-a-Judge will happen on every tool response using the `intent` model alias, which maps to `small` by default.

The `description` intent is a special value that gets expanded to the tool description.

```js 'intent: "description"''
defTool(
    "fetch",
    "Gets the live weather",
    {
        location: "Seattle",
    },
    async (args) => { ... },
    {
        intent: "description",
    }
)
```

## Packaging as System scripts

To pick and choose which tools to include in a script,
you can group them in system scripts. For example,
the `current_weather` tool can be included the `system.current_weather.genai.mjs` script.

```js wrap file="system.current_weather.genai.mjs" 'defTool("current_weather", ...)'
script({
    title: "Get the current weather",
})
defTool("current_weather", ...)
```

then use the tool id in the `tools` field.

```js 'tools: ["current_weather"]'
script({
    ...,
    tools: ["current_weather"],
})
```

### Example

Let's illustrate how tools come together with a question answering script.

In the script below, we add the `retrieval_web_search` tool. This tool
will call into `retrieval.webSearch` as needed.

```js file="answers.genai.mjs"
script({
    title: "Answer questions",
    tool: ["retrieval_web_search"]
})

def("FILES", env.files)

$`Answer the questions in FILES using a web search.

- List a summary of the answers and the sources used to create the answers.
```

We can then apply this script to the `questions.md` file below.

```md file="questions.md"
- What is the weather in Seattle?
- What laws were voted in the USA congress last week?
```

After the first request, the LLM requests to call the `web_search` for each questions.
The web search answers are then added to the LLM message history and the request is made again.
The second yields the final result which includes the web search results.

<BuiltinTools />
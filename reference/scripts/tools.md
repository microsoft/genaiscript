import { Code } from "@astrojs/starlight/components"
import { Content as BuiltinTools } from "../../../../components/BuiltinTools.mdx"
import weatherScriptSource from "../../../../../../packages/sample/genaisrc/weather.genai.js?raw"
import mathScriptSource from "../../../../../../packages/sample/genaisrc/math-agent.genai.mjs?raw"

You can register **tools** (also known as **functions**) that the LLM may decide to call as part of assembling the answer.
See [OpenAI functions](https://platform.openai.com/docs/guides/function-calling), [Ollama tools](https://ollama.com/blog/tool-support),
or [Anthropic tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use).

Not all LLM models support tools, in those cases, GenAIScript also support a fallback mechanism to implement tool call through system prompts (see [Fallback Tools](#fallbacktools)).

## `defTool`

`defTool` is used to define a tool that can be called by the LLM.
It takes a JSON schema to define the input and expects a string output.

**The LLM decides to call this tool on its own!**

```javascript
defTool(
    "current_weather",
    "get the current weather",
    {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
            },
        },
        required: ["location"],
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

## Agentic Tools

[Agentic](https://agentic.so) is
a standard library of AI functions / tools
which are optimized for both normal TS-usage as well as LLM-based usage.
You can register any agentic tool in your script using `defTool`.

```js
import { calculator } from "@agentic/calculator"
defTool(calculator)
```

See [Agentic tools](/genaiscript/guides/agentic-tools) for more information.

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

- or add the `--fallack-tools` flag to the CLI

```sh "--fallback-tools"
npx genaiscript run ... --fallback-tools
```

:::note

The performance of this feature will vary greatly based on the LLM model you decide to use.

:::

## Packaging as System scripts

To pick and choose which tools to include in a script,
you can group them in system scripts. For example,
the `current_weather` tool can be included the `system.current_weather.genai.mjs` script.

```javascript file="system.current_weather.genai.mjs" 'defTool("current_weather", ...)'
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
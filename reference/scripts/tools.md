
import { Code } from '@astrojs/starlight/components';
import { Content as BuiltinTools } from "../../../../components/BuiltinTools.mdx"
import weatherScriptSource from "../../../../../../packages/sample/genaisrc/weather.genai.js?raw"
import mathScriptSource from "../../../../../../packages/sample/genaisrc/math-agent.genai.mjs?raw"

You can register **tools** (also known as **functions**) that the LLM may decide to call as part of assembling the answer.
See [OpenAI functions](https://platform.openai.com/docs/guides/function-calling).

## Definition

`defTool` is used to define a tool that can be called by the LLM.
It takes a JSON schema to define the input and expects a string output. **The LLM decides to call
this tool on its own!**

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

<Code code={weatherScriptSource} wrap={true} lang="js" title="weather.genai.mjs" />

### Math tool example

This example uses the [math expression evaluator](/genaiscript/reference/scripts/math) 
to evaluate a math expression.

<Code code={mathScriptSource} wrap={true} lang="js" title="math-agent.genai.mjs" />

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

then use the script id in the `tools` field.

```js 'tools: ["system.current_weather"]'
script({
    ...,
    tools: ["system.current_weather"],
})
```

<BuiltinTools />

## Example

Let's illustrate how tools come together with a question answering script.

In the script below, we add the `system.retrieval_web_search` which registers the `retrieval_web_search` tool. This tool
will call into `retrieval.webSearch` as needed.

```js file="answers.genai.mjs"
script({
    title: "Answer questions",
    system: ["system", "system.retrieval_web_search"]
})

def("FILES", env.files)

$`Answer the questions in FILES using a web search.

- List a summary of the answers and the sources used to create the answers.
```

We can then apply this script to the `questions.md` file blow.

```md file="questions.md"
-   What is weather in Seattle?
-   What laws were voted in the USA congress last week?
```

After the first request, the LLM requests to call the `web_search` for each questions.
The web search answers are then added to the LLM message history and the request is made again.
The second yields the final result which includes the web search results.

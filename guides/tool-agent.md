
import { Code } from "@astrojs/starlight/components"
import mathAgentSrc from "../../../../../packages/sample/genaisrc/math-agent.genai.mjs?raw"
import mathAgentSystemSrc from "../../../../../packages/sample/genaisrc/math-agent-system.genai.js?raw"

Using [tools (formerly functions)](/genaiscript/reference/scripts/tools),
you can define a built-in agent that can take decisions
and reasoning based on the tools provided to it.

Let's illustrate this concept using the [llamaindex sum div sample](https://ts.llamaindex.ai/examples/agent):
an agent that can sum or divide two numbers and needs to answer basic arithmetic questions.

## Using tools

By declaring tools (and providing a descriptive description), you provide the opportunity
for the LLM to requests a tool call during the output generation. In the snippet below,
we declare a tool that can sum two numbers. It will be called by the LLM when a sum operation
is required.

```js "defTool"
defTool(
    "sum",
    "Sum two numbers",
    {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "The first number",
            },
            b: {
                type: "number",
                description: "The second number",
            },
        },
        required: ["a", "b"],
    },
    ({ a, b }) => `${a + b}`
)
```

You can also simplify the parameter definition by provider an example object and the schema will be inferred.\_createMdxContent

```js "{ a: 1, b: 2 }"
defTool("sum", "Sum two numbers", { a: 1, b: 2 }, ({ a, b }) => `${a + b}`)
```

## Parameters

The arithmetic question can be declared as a [script parameter](/genaiscript/reference/scripts/variables) to be used in the agent script.

```js "parameters"
script({
    ...,
    parameters: {
        "question": {
            type: "string",
            default: "How much is 5 + 5? then divide by 2?"
        }
    }
})
```

The parameter value are populated in the `env.vars` object.

```js "env.vars.question"
...
$`Answer the following arithmetic question:

    ${env.vars.question}
`
```

Putting it all together, we define another tool to divide two numbers
and inline an arithmetic question.

```js wrap
script({
    title: "math-agent",
    model: "small",
    description: "A port of https://ts.llamaindex.ai/examples/agent",
    parameters: {
        question: {
            type: "string",
            default: "How much is 11 + 4? then divide by 3?",
        },
    },
    tests: {
        description: "Testing the default prompt",
        keywords: "5",
    },
})

defTool(
    "sum",
    "Use this function to sum two numbers",
    {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "The first number",
            },
            b: {
                type: "number",
                description: "The second number",
            },
        },
        required: ["a", "b"],
    },
    ({ a, b }) => `${a + b}`
)

defTool(
    "divide",
    "Use this function to divide two numbers",
    {
        type: "object",
        properties: {
            a: {
                type: "number",
                description: "The first number",
            },
            b: {
                type: "number",
                description: "The second number",
            },
        },
        required: ["a", "b"],
    },
    ({ a, b }) => `${a / b}`
)

$`Answer the following arithmetic question: 

    ${env.vars.question}
`
```

{/* genaiscript output start */}

<details>
<summary>👤 user</summary>

```markdown wrap
Answer the following arithmetic question:

How much is 11 + 4? then divide by 3?
```

</details>

<details open>
<summary>🤖 assistant </summary>

-   📠 tool call `divide({"a":15,"b":3})` (`call_9p0oWdWpT6vGyxzwq2vJXHrq`)

</details>

<details>
<summary>🛠️ tool <code>call_9p0oWdWpT6vGyxzwq2vJXHrq</code></summary>

```json wrap
5
```

</details>

<details open>
<summary>🤖 assistant </summary>

```markdown wrap
The result of (11 + 4) divided by 3 is 5.
```

</details>

{/* genaiscript output end */}

## Using `system.math`

The system prompt [system.math](/genaiscript/reference/scripts/system#systemmath)
wraps the `parsers.math` expression parser and evaluator and exposes it as a tool.

This simplifies the agent script as we do not have to define tools anymore.

<Code
    title="math-agent.genai.mjs"
    code={mathAgentSystemSrc}
    wrap={true}
    lang="js"
/>

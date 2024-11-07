script({ system: ["system.tool_calls"] })
defTool("random", "Generate a random number", {}, () => Math.random())
defTool(
    "weather",
    "Gets the weather in a city",
    {
        type: "object",
        properties: {
            city: {
                type: "string",
                description: "The name of the city",
            },
        },
        required: ["city"],
    },
    () => "sunny"
)
defTool(
    "browse",
    "Download the HTML of a page",
    {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
    },
    ({ url }) => "<html>empty</html>"
)
defTool(
    "math_add",
    "Add two numbers",
    { a: { type: "number" }, b: { type: "number" } },
    ({ a, b }) => String(a + b)
)

$`Answer all questions. Be concise, do not explain:

- Generate a random number between 0 and 1. 
- Tell the weather in Brussels now.
- Download the HTML of https://bing.com
- Compute the sum of 0.123123 + 0.123123
`

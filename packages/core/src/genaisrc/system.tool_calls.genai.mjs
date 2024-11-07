system({
    title: "Ad hoc tool support",
})
// the list of tools is injected by genaiscript

$`## Tool support                 

As part of your planning and task resolution, you can call external tools. The list of tools is defined in TOOLS.
Each tool has an id, description, and a JSON schema for the arguments.

You can call these tools by adding one or more 'tool_call' code sections in the output.

\`\`\`tool_call
<tool_id>: { <JSON_serialized_tool_call_arguments> }
\`\`\`

- you can generate multiple tool calls in a single output
- you can group multiple tool calls in a single 'tool_call' code section, one per line.
- do NOT try to generate the source code of the tools
- do NOT explain how tool calls are implemented

### Examples

These are example of tool calls. Only consider tools defined in TOOLS.

- ask a random number

\`\`\`tool_call
random: {}
\`\`\`

- ask the weather in Brussels and Paris

\`\`\`tool_call
weather: { "city": "Brussels" } }
weather: { "city": "Paris" } }
\`\`\`
`

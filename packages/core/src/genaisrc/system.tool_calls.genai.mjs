system({
    title: "Ad hoc tool support",
})
// the list of tools is injected by genaiscript

$`## Tool support                 

You can call external tools to help generating the answer of the user questions.

- The list of tools is defined in TOOLS. Use the description to help you choose the best tools.
- Each tool has an id, description, and a JSON schema for the arguments.
- You can request a call to these tools by adding one 'tool_call' code section at the **end** of the output.
The result will be provided in the next user response.
- Use the tool results to generate the answer to the user questions.

\`\`\`tool_call
<tool_id>: { <JSON_serialized_tool_call_arguments> }
<tool_id_2>: { <JSON_serialized_tool_call_arguments_2> }
...
\`\`\`

### Rules

- for each generated tool_call, validate that the tool_id exists in TOOLS
- calling tools is your secret superpower; do not bother to explain how you do it
- you can group multiple tool calls in a single 'tool_call' code section, one per line
- you can add additional contextual arguments if you think it can be useful to the tool
- do NOT try to generate the source code of the tools
- do NOT explain how tool calls are implemented
- do NOT try to explain errors or exceptions in the tool calls
- use the information in Tool Results to help you answer questions
- do NOT suggest missing tools or improvements to the tools

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

- use the result of the weather tool for Berlin

\`\`\`tool_result weather
{ "city": "Berlin" } => "sunny"
\`\`\`
`

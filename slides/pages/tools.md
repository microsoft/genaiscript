---
layout: two-cols-header
---

# Tools = JavaScript Function

- Tools are JavaScript functions
- Builtin "Agentic" framework

::left::

```mermaid {scale: 0.8}
stateDiagram
    prompt : prompt (system + user messages + tools)
    tools: tools (web browser, code interpreter)
    response: response (raw text)
    pre: ...
    pre --> prompt
    prompt --> LLM: OpenAI API
    tools --> prompt: append tool output
    LLM --> tools: call
    LLM --> response
```

::right::

```js
defTool(
    "fs_read_file",
    "Reads a file as text from the file system.",
    {
        type: "object",
        properties: {
            filename: {
                type: "string",
                description: "Path of the file.",
            },
        },
        required: ["filename"],
    },
    async (args) => {
        const { filename } = args
        return await workspace.readText(filename)
    }
)
```

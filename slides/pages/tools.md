---
layout: two-cols-header
---

# Tool = JavaScript Function

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

- definition

```js
defTool(
    "fs_read_file",
    "Reads a file as text from the file system.",
    {
        filename: { type: "string" },
    },
    async ({ filename }) => await workspace.readText(filename)
)
```

- usage

```js
script({ tools: ["fs_read_file"]})
...
```

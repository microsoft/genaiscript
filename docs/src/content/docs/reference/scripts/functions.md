---
title: Functions
sidebar:
    order: 7
---

You can register functions that the LLM may decide to call as part of assembling the answer.
See [OpenAI functions](https://platform.openai.com/docs/guides/function-calling).

```js
defFunction(
    "get_current_weather",
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

## Running CLIs as functions

A function may also return a request to run a native tool in a terminal. The `stdout` output of the tool
will be used as the function result.

```js
defFunction(
    "check_syntax",
    "Checks code for syntax errors",
    {
        type: "object",
        properties: {
            code: {
                type: "string",
                description: "Code to check.",
            },
        },
        required: ["code"],
    },
    (args) => {
        const { code } = args
        return {
            type: "shell",
            stdin: code,
            command: "node",
            args: ["genaiscript/check-syntax.js"],
        }
    }
)
```

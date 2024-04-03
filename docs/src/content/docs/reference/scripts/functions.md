---
title: Functions
description: Learn how to define and use functions within GenAIScript to enhance answer assembly with custom logic and CLI tools.
keywords: functions, custom logic, CLI integration, scripting, automation
sidebar:
    order: 7
---

You can register functions that the LLM may decide to call as part of assembling the answer.
See [OpenAI functions](https://platform.openai.com/docs/guides/function-calling).

## Definition

The `defFunction` function is used to define a function that can be called by the LLM.
It takes a JSON schema to define the input and expects a string output. **The LLM decides to call 
this function on its own!**

```javascript
defFunction(
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

## Packaging as System scripts

To pick and choose which functions to include in a script,
you can group them in system prompt scripts. For example,
the `current_weather` function can be included the `system.current_weather.genai.js` script.

```javascript file="system.current_weather.genai.js"
script({
    title: "Function to get the current weather",
    group: "Functions",
})
defFunction("current_weather", ...)
```

## Builtin functions

- [system.web_search](https://github.com/microsoft/genaiscript/blob/main/packages/core/src/genaisrc/system.web_search.genai.js): Search the web for a user query.
- [system.fs_find_files](https://github.com/microsoft/genaiscript/blob/main/packages/core/src/genaisrc/system.fs_find_files.genai.js): List files for a filename query.
- [system.fs_read_file](https://github.com/microsoft/genaiscript/blob/main/packages/core/src/genaisrc/system.fs_read_file.genai.js): Read the content of a file.

## Example

Let's illustrate how functions come together with a question answering script.

In the script below, we add the ``system.web_search` which registers the `web_search` function. This function
will call into `retrieval.webSearch` as needed.

```js file="answers.genai.js"
script({
    title: "Answer questions",
    system: ["system", "system.web_search"]
})

def("FILES", env.files)

$`Answer the questions in FILES using a web search. 

- List a summary of the answers and the sources used to create the answers.
```

We can then apply this script to the `questions.md` file blow.

```md file="questions.md"
- What is weather in Seattle?
- What laws were voted in the USA congress last week?
```

After the first request, the LLM requests to call the `web_search` for each questions. 
The web search answers are then added to the LLM message history and the request is made again.
The second yields the final result which includes the web search results.
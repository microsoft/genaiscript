---
title: Getting Started
sidebar:
    order: 0
description: Start developing with the GenAIScript VS Code Extension to create AI scripts efficiently.
keywords:
    - AI Scripting Extension
    - VS Code AI
    - Generative AI Development
    - AI Extension Setup
    - AI Code Automation
---

GenAIScript is a scripting language that integrates LLMs into the scripting process using a simplified JavaScript syntax.
It allows users to create, debug, and automate LLM-based scripts.

GenAIScript brings the flexibility of JavaScript with the convinience of built-in output parsing
to streamline the creation of LLM-based software solutions.

## the script

The following script
takes a file with text content (.txt, .pdf, .docx) as input and
saves a summary of the file in another file.

```js wrap title="summarize.genai.js"
// metadata and model configuration
script({ title: "Summarize", model: "gpt4" })
// insert the context, define a "FILE" variable
const file = def("FILE", env.files)
// appends text to the prompt (file is the variable name)
$`Summarize ${file}. Save output to ${file}.summary`
```

GenAIScript will execute `summarize.genai.js` and generate the user message that will be sent to the LLM chat.
It also populates the `env.files` variable with the files selected in the context (from a user UI interaction or CLI arguments).

````txt title="user prompt" wrap
FILE ./lorem.txt:
```txt
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
```

Shorten the following FILE. Limit changes to minimum.
````

## System scripts

GenAIScript also automatically selects system scripts to support file generation and other features. Since
we're using files in this script, it will run the `system.files` script which teaches the LLM how to format files
in a structured format.

```js title="system.files.genai.js"
system({ title: "File generation" })
const folder = env.vars["outputFolder"] || "."
$`When generating or updating files you will use this syntax:`
def(`File ${folder}/file1.ts`, `What goes in ${folder}/file1.ts`, {
    language: "typescript",
})
```

And the resulting system prompt.

````txt title="system prompt"
When generating or updating files you will use the following syntax:
File ./file1.ts
```typescript
What goes in ./file1.ts
```
````

## LLM invocation

All the generated prompts are formatted and sent to the LLM server, which can be remote like [OpenAI](https://platform.openai.com/docs/api-reference/chat/create) or running locally like [ollama](https://ollama.com/) (there are many other LLM providers).

```json title="llmrequest.json"
{
    "model": "gpt4",
    "messages": [
        { "role": "system", "content": "When generating... " },
        { "role": "user", "content": "FILE ./lorem.txt:..." }
    ]
}
```

## Output parsing

The LLM responds with a text which can be parsed for various micro-formats,
like markdown code fences, files or annotations.

````txt title="llmresponse.txt"
File ./lorem.txt.summary
```
Lorem Ipsum.
```
````

GenAIScript automatically makes sense of the output and exposes it through a [Refactoring Preview](https://code.visualstudio.com/docs/editor/refactoring#_refactor-preview) or directly saved to the file system.

Of course, things can get more complex - with functions, schemas, ... -, but this is the basic flow of a GenAIScript script.

## Next steps

Let's start by [installing the extension in Visual Studio Code](/genaiscript/getting-started/installation).

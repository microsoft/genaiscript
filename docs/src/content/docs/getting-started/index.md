---
title: Getting Started
sidebar:
    order: 0
description: Start developing with the GenAIScript VS Code Extension to create
    AI scripts efficiently.
keywords:
    - AI Scripting Extension
    - VS Code AI
    - Generative AI Development
    - AI Extension Setup
    - AI Code Automation
genaiscript:
    model: openai:gpt-3.5-turbo
    files: src/samples/markdown-small.txt
---

GenAIScript is a scripting language that integrates LLMs into the scripting process using a simplified JavaScript syntax.
It allows users to create, debug, and automate LLM-based scripts.

GenAIScript brings the flexibility of JavaScript with the convenience of built-in output parsing
to streamline the creation of LLM-based software solutions.

## script = prompt generator

The following script generates a prompt that
takes files (.txt, .pdf, .docx) as input and
saves the summaries in another files.

```js wrap title="summarize.genai.mjs" system=false assistant=true user=true
// context: define a "FILE" variable
const file = def("FILE", env.files)
// task: appends text to the prompt (file is the variable name)
$`Summarize ${file} in one sentence. Save output to ${file}.summary`
```

<!-- genaiscript output start -->

<details style="margin-left: 1rem;"  open>
<summary>👤 user</summary>

````markdown wrap
FILE:

```txt file="src/samples/markdown-small.txt"
What is Markdown?

Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.
```

Summarize FILE in one sentence. Save output to FILE.summary
````

</details>

<details style="margin-left: 1rem;"  open>
<summary>🤖 assistant</summary>

````markdown wrap
File src/samples/markdown-small.txt.summary:

```txt
Markdown is a lightweight markup language created by John Gruber in 2004, known for adding formatting elements to plaintext text documents.
```
````

</details>

<!-- genaiscript output end -->

GenAIScript will execute `summarize.genai.js` and generate the `👤 user` message that will be sent to the LLM chat. It also populates the `env.files` variable with the files selected in the context (from a user UI interaction or CLI arguments).

The LLM responds with the `🤖 assistant` message and GenAIScript parses the output
to extract structured data.

## LLM invocation

All the generated prompts are formatted and sent to the LLM server, which can be remote like [OpenAI](https://platform.openai.com/docs/api-reference/chat/create) or running locally like [ollama](https://ollama.com/) (there are many other LLM providers).

```json
{
    "model": "gpt4",
    "messages": [
        { "role": "system", "content": "When generating... " },
        { "role": "user", "content": "FILE src/samples/...:" }
    ]
}
```

## Output parsing

The LLM responds with a text which can be parsed for various micro-formats,
like markdown code fences, files or annotations.

GenAIScript automatically makes sense of the output and exposes it through a [Refactoring Preview](https://code.visualstudio.com/docs/editor/refactoring#_refactor-preview) or directly saved to the file system.

Of course, things can get more complex - with functions, schemas, ... -, but this is the basic flow of a GenAIScript script.
If you're looking for an exhaustive list of prompting techniques, checkout [the prompt report](https://learnprompting.org/).

## Next steps

Let's start by [installing the extension in Visual Studio Code](/genaiscript/getting-started/installation).

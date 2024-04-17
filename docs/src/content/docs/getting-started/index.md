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

GenAIScript is a scripting language that makes LLMs a first-class 
part of the scripting process, easily allowing users to author, debug, 
and deploy LLM-based scripts.  GenAIScript uses stylized JavaScript with minimal 
syntax to define Generative AI scripts and is supported by a VSCode extension.
Because LLMs and foundation models can do things that other kinds of software
cannot do, the core of every GenAIScript is a call to the LLM to perform some
function. For example, the following script
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

GenAIScript takes care of assembling prompts, sending them to the LLM and parsing
out the results in a structured way. While the implementation of this internal plumbing
is complex, all the internal prompts and invocations can be easily investigated through a detailed trace,
giving the user transparency to how the script is processed and what the model sees.

## Transformation overview

Here is a short overview how this GenAIScript script is used
to create a prompt, send it to a LLM and parse the response
into structured output.

### User prompt

When GenAIScript executes, it populates the `env.files` variable with the files selected in the context.
As the script executes, the prompt that will be sent to the LLM is constructed.

In this example, it would be like the text below for a `lorem.txt` file.

````txt title="user prompt" wrap
FILE ./lorem.txt:
```txt
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
```

Shorten the following FILE. Limit changes to minimum.
````

### System prompts

GenAIScript also automatically selects system prompts to support file generation and other features. Since
we're using files in this script, it will run the `system.files` script which teaches the LLM how to format files.

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

### LLM invocation

All the generate prompts are formatted and sent to the LLM for processing. Typically, using the [OpenAI Chat API](https://platform.openai.com/docs/api-reference/chat/create) (or compatible), this would be a JSON object with an array of messages.

```json title="llmrequest.json"
{
    "model": "gpt4",
    "messages": [
        { "role": "system", "content": "When generating... " },
        { "role": "user", "content": "FILE ./lorem.txt:..." }
    ]
}
```

### Output parsing

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

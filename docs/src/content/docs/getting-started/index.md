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

GenAiScript is a Visual Studio Code Extension that uses
stylized JavaScript with minimal syntax to define Generative AI scripts.

```js
// metadata and model configuration
script({ title: "Shorten", model: "gpt4" })
// insert the context
def("FILE", env.files)
// appends text to the prompt
$`Shorten the following FILE. Limit changes to minimum.`
```

GenAIScript takes care of assembling prompts, sending them to the LLM and parsing
out the results in a structured way. All the internal prompts and invocations can be easily investigated through a detailed trace.

## Next steps

Let's start by [installing the extension in Visual Studio Code](/genaiscript/getting-started/installation).

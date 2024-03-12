---
title: Getting Started
sidebar:
    order: 0
description: Learn how to get started with the GenAIScript VS Code Extension for creating AI scripts.
keywords:
    - GenAIScript Setup
    - AI Scripting
    - VS Code AI Extension
    - Generative AI
    - AI Development Tools
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
out the results in a structured way. All the internal prompt and invacotion are easily investigated through a detail trace.

## Next steps

Let's start by [installing the extension in Visual Studio Code](/genaiscript/getting-started/installation).

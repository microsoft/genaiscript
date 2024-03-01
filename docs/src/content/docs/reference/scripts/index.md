---
title: Overview
sidebar:
    order: 0
description: Learn how to use and customize GenAIScript templates for efficient AI prompt expansion.
keywords: script templates, AI prompts, prompt expansion, OpenAI integration, template customization
---

GenAIScript has a text template engine that is used to expand and assemble prompts before being sent to OpenAI. These templates can be forked and modified.

All prompts are JS files named as `*.genai.js`. You can use the `GenAIScript - Fork a script...` to fork any known prompt.

All `system.*.genai.js` are considered system prompt templates
and are unlisted by default. There is no variable expansion in those.

## Example

```js
script({
    title: "Shorten", // displayed in UI and Copilot Chat
    // also displayed but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
})

// you can debug the generation using goo'old logs
console.log("this shows up in the `console output` section of the trace")

// but the variable is appropriately delimited
def("FILE", env.files)

// this appends text to the prompt
$`Shorten the following FILE. Limit changes to minimum. Respond with the new FILE.`
```

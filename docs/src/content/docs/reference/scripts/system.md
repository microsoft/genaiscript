---
title: System Prompts
sidebar:
    order: 10
---

System prompts are scripts that are executed and injected before the main prompt output.

-   `system.*.genai.js` are considered system prompt templates
-   system prompts are unlisted by default
-   system prompts must use the `system` function instead of `script`.

```js title="system.zscot.genai.js" "system"
system({
    title: "Zero-shot Chain of Thought",
})
$`Let's think step by step.`
```

## Builtin System Prompts

GenAIScript comes with a number of system prompt that support features like creating files, extracting diffs or
generating annotations. If unspecified, GenAIScript looks for specific keywords to activate the various system prompts.

## Custom system prompts

The `system` field can be populated with an array of system prompt identifiers.

```js "system"
script({
    ...,
    system: ["system.diff", "system.files"]
})
```

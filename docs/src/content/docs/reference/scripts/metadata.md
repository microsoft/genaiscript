---
title: Metadata
sidebar:
    order: 2
description: Learn how to configure script metadata to enhance functionality and user experience in GenAIScript.
keywords: script metadata, configuration, LLM parameters, customization, script management
---

Prompts use `script({ ... })` function call
to configure the title and other user interface elements.

The call to `script` is optional and can be omitted if you don't need to configure the prompt.
However, the `script` argument should a valid [JSON5](https://json5.org/) literal as the script is parsed and not executed when mining metadata.

## Title, description, group

The `title`, `description` and `group` are used in the UI to display the prompt.

```javascript
script({
    title: "Shorten", // displayed in UI
    // also displayed but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    group: "shorten", // see Inline prompts later
})
```

### title

`title` is used as the prompt name, displayed in the light-bulb UI

```js
script({ title: "Shorten" })
```

#### description

`description` provides more details and context about the prompt.

```js
script({
    title: "Shorten",
    description:
        "A prompt that shrinks the size of text without losing meaning.",
})
```

### category

Helps organizing your scripts.

```js
script({
    ...
    category: ["proofreading"]
})
```

### system

Override the system prompts included with the script.

```js
script({
    ...
    system: ["system.files"],
})
```

### model

You can specify the LLM `model` identifier in the script. The default is `gpt-4`.
The IntelliSense provided by `genaiscript.g.ts` will assist in discovering the list of supported models.

```js
script({
    ...,
    model: "openai:gpt-4o",
})
```

:::tip
You can override the model from the [CLI](/genaiscript/reference/cli/)
:::

### maxTokens

You can specify the LLM `max tokens` in the script. The default is unspecified.

```js
script({
    ...,
    maxTokens: 2000,
})
```

### maxToolCalls

Limits the amount of allowed function/tool call during a generation. This is useful to prevent infinite loops.

```js
script({
    ...,
    maxToolCalls: 100,
})
```

### temperature

You can specify the LLM `temperature` in the script, between `0` and `2`. The default is `0.01`.

```js
script({
    ...,
    temperature: 0.8,
})
```

### top_p

You can specify the LLM `top_p` in the script. The default is not specified

```js
script({
    ...,
    top_p: 0.5,
})
```

### seed

For some models,You can specify the LLM `seed` in the script, for models that support it. The default is not specified.
For some models, you can specify the LLM `seed` in the script, for models that support it. The default is unspecified.

```js
script({
    ...,
    seed: 12345678,
})
```

### fileMerge: (label, before, generated) => string

A function that merges the generated content with the original content. The default is to replace the original content with the generated content. This function can be used to implement custom merge strategies.

### Other parameters

-   `unlisted: true`, don't show it to the user in lists. Template `system.*` are automatically unlisted.

See `genaiscript.d.ts` in the sources for details.

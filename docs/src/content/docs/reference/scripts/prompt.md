---
title: Prompt ($)
sidebar:
    order: 2
description: Learn how to use the tagged template literal for dynamic prompt generation in GenAI scripts.
keywords: tagged template, prompt expansion, dynamic prompts, JavaScript templates, GenAI scripting
---

The `$` is a JavaScript [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) that expands the string into the final prompt.

```javascript title="example.genai.js"
...
$`You are a helpful assistant.`
```

```txt title="Final prompt"
You are a helpful assistant.
```

## Inline expressions

You can weave expressions in the template using `${...}`. Expression can be promises and will be awaited when rendering the final prompt.

```js title="example.genai.js"
$`Today is ${new Date().toDateString()}.`
```

```txt title="Final prompt"
Today is Fri Mar 01 2024.
```


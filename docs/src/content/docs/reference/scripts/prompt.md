---
title: $ (prompt)
sidebar:
    order: 2
---

The `$` is a JavaScript [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) that expands the string into the final prompt.

```js title="example.genai.js"
...
$`You are a helpful assistant.`
```

```txt title="Final prompt"
You are a helpful assistant.
```

## Inline expressions

You can weave expressions in the template using `${...}`.

```js title="example.genai.js"
$`Today is ${new Date().toDateString()}.`
```

```txt title="Final prompt"
Today is Fri Mar 01 2024.
```

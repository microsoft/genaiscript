---
title: Prompt ($)
sidebar:
  order: 2
description: Learn how to use the tagged template literal for dynamic prompt
  generation in GenAI scripts.
keywords: tagged template, prompt expansion, dynamic prompts, JavaScript
  templates, GenAI scripting
genaiscript:
  model: openai:gpt-3.5-turbo

---

The `$` is a JavaScript [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) that expands the string into the final prompt.

```js title="example.genai.js" assistant=false user=true
$`You are a helpful assistant.`
```

<!-- genaiscript output start -->

<details open>
<summary>👤 user</summary>


```markdown wrap
You are a helpful assistant.
```


</details>

<!-- genaiscript output end -->




## Inline expressions

You can weave expressions in the template using `${...}`. Expression can be promises and will be awaited when rendering the final prompt.

```js title="example.genai.js" assistant=false user=true
$`Today is ${new Date().toDateString()}.`
```

<!-- genaiscript output start -->

<details open>
<summary>👤 user</summary>


```markdown wrap
Today is Thu Jun 13 2024.
```


</details>

<!-- genaiscript output end -->




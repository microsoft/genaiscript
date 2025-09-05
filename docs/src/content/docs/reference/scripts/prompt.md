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
hero:
  image:
    alt: An 8-bit-style flat icon features a geometric speech bubble containing code
      brackets and a dollar sign, symbolizing coding or template expressions.
      Around the bubble are small, simple blocks and circles representing
      variables and template elements, all rendered in a clean, minimal,
      five-color corporate palette on a transparent background, using only basic
      geometric shapes. The image excludes people, text, shadows, gradients, or
      3D effects.
    file: ./prompt.png
llmstxt:
  content: >-
    The `$` is a JavaScript tagged template that dynamically generates strings.
    It supports inline expressions, allowing `${...}` to embed values or await
    promises. Example: `$`Today is ${new Date().toDateString()}.` outputs the
    current date. 


    The `$` output can integrate with template engines like Jinja or Mustache
    for further processing: `$`What is the capital of {{ country
    }}?`.jinja(env.vars)` or `.mustache(env.vars)`.


    For inline prompts, use `$` within the generation context: `await
    runPrompt(ctx => { ctx.$`What is the capital of France?` })`. This enables
    dynamic prompt creation during execution.
  hash: 3b7a52b6417da14778710b5ac10fed94fcdb46539a6346fcdb8a5574fee13675

---

The `$` is a JavaScript [tagged template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) that expands the string into the final prompt.

```js title="example.genai.mjs" assistant=false user=true
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

You can weave expressions in the template using `${...}`. Expressions can be promises and will be awaited when rendering the final prompt.

```js title="example.genai.mjs" assistant=false user=true
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



## String templating

The output of the `$` can be further processed by running popular [jinja](https://www.npmjs.com/package/@huggingface/jinja) or [mustache](https://mustache.github.io/) template engines.

```js "jinja"
$`What is the capital of {{ country }}?`.jinja(env.vars)
```

```js "mustache"
$`What is the capital of {{ country }}?`.mustache(env.vars)
```

## Inline prompts

When running an [inline prompt](/genaiscript/reference/scripts/inline-prompts), you can use the `$` to generate the prompt dynamically but you need to call it on the generation context.

```js title="example.genai.mjs" "ctx.$"
const res = await runPrompt(ctx => {
  ctx.$`What is the capital of France?`
})
```
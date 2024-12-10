
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

When running an [inline prompt](/docs/reference/scripts/inline-prompts), you can use the `$` to generate the prompt dynamically but you need to call it on the generation context.

```js title="example.genai.mjs" "ctx.$"
const res = await runPrompt(ctx => {
  ctx.$`What is the capital of France?`
})
```
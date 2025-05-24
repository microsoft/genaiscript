Prompt caching is a feature that can reduce processing time and costs for repetitive prompts.
It is supported by various LLM providers, but the implementation may vary.

## `ephemeral`

You can mark `def` section or `$` function with `cacheControl` set as `"ephemeral"` to enable prompt caching optimization. This essentially means that it
is acceptable for the LLM provider to cache the prompt for a short amount of time.

```js
def("FILE", env.files, { cacheControl: "ephemeral" })
```

```js
$`Some very cool prompt`.cacheControl("ephemeral")
```

## LLM provider supporet

In most cases, the `ephemeral` hint is ignored by LLM providers. However, the following are supported

### OpenAI, Azure OpenAI

[Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) of the prompt prefix
is automatically enabled by OpenAI. All ephemeral annotations are removed.

- [OpenAI Documentation](https://openai.com/index/api-prompt-caching/).

### Anthropic

The `ephemeral` annotation is converted into `'cache-control': { ... }` field in the message object.

Note that prompt caching is still marked as beta and not supported in all models (specially the older ones).

- [Anthropic Documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
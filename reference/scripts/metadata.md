Prompts use `script({ ... })` function call
to configure the title and other user interface elements.

The call to `script` is optional and can be omitted if you don't need to configure the prompt.
However, the `script` argument should a valid [JSON5](https://json5.org/) literal as the script is parsed and not executed when mining metadata.

## Title, description, group

The `title`, `description` and `group` are (optionally) used in the UI to display the prompt.

```javascript
script({
    title: "Shorten", // displayed in UI
    // also displayed but grayed out:
    description:
        "A prompt that shrinks the size of text without losing meaning",
    group: "shorten", // see Inline prompts later
})
```

### system

Override the system prompts included with the script. The default set of system prompts is inferred dynamically from the script content.

```js
script({
    ...
    system: ["system.files"],
})
```

### model

You can specify the LLM `model` identifier in the script.
The IntelliSense provided by `genaiscript.g.ts` will assist in discovering the list of supported models.
Use `large` and `small` aliases to select default models regardless of the configuration.

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

You can specify the LLM maximum **completion** tokens in the script. The default is unspecified.

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

You can specify the LLM `temperature` in the script, between `0` and `2`. The default is `0.8`.

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

For some models, you can specify the LLM `seed` in the script, for models that support it. The default is unspecified.

```js
script({
    ...,
    seed: 12345678,
})
```

### metadata

You can specify a set of metadata key-value pairs in the script. This will enable [stored completions](/genaiscript/reference/scripts/stored-completions) in OpenAI and Azure OpenAI. This is used for distillation and evaluation purposes.

```js
script({
    ...,
    metadata: {
        name: "my_script",
    }
})
```

### Retry options

You can configure retry behavior for failed LLM requests to improve reliability:

```js
script({
    ...,
    retries: 3,                    // Number of retry attempts (default: 2)
    retryDelay: 1000,             // Initial delay in ms between retries (default: 1000) 
    maxDelay: 5000,               // Maximum delay in ms with exponential backoff (default: 10000)
    maxRetryAfter: 10000,         // Maximum time in ms to respect retry-after headers (default: 10000)
    retryOn: [429, 500, 502, 503, 504], // HTTP status codes to retry on (default: [429, 500, 502, 503, 504])
})
```

These retry options help handle:
- **Rate limiting** (HTTP 429): Automatically waits for rate limit windows
- **Server errors** (HTTP 5xx): Retries on temporary server issues
- **Network failures**: Uses exponential backoff to avoid overwhelming services

Retry options can also be passed to `runPrompt()` calls to override script-level settings:

```js
const { text } = await runPrompt(
    (_) => _.$`Summarize this text.`,
    {
        model: "small",
        retries: 2,           // Override script retry settings
        retryDelay: 500,      // Faster initial retry
        maxDelay: 3000,       // Lower maximum delay
    }
)
```

### Other parameters

- `unlisted: true`, don't show it to the user in lists. Template `system.*` are automatically unlisted.

See `genaiscript.d.ts` in the sources for details.

## `env.meta`

You can consult the metadata of the top level script in the `env.meta` object.

```js
const { model } = env.meta
```

## Model resolution

Use the `host.resolveModel` function to resolve a model name or alias to its provider and model name.

```js wrap
const info = await host.resolveModel("large")
console.log(info)
```

```json
{
    "provider": "openai",
    "model": "gpt-4o"
}
```
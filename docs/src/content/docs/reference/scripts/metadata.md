---
title: Metadata
sidebar:
  order: 2
description: Learn how to configure script metadata to enhance functionality and
  user experience in GenAIScript.
keywords: script metadata, configuration, LLM parameters, customization, script
  management
hero:
  image:
    alt: A small, square digital illustration in 8-bit flat style showing a
      simplified computer window. Inside are separated areas formed by
      rectangles and circles, each sectioned with bold, bright colors to
      represent different configuration settings—model, tokens, temperature, and
      group options—depicted with shapes like sliders, toggles, and labeled
      blocks. The design is clean with no text, people, backgrounds, or visual
      effects, emphasizing a clear, easy-to-distinguish layout.
    file: ./metadata.png
llmstxt:
  content: >-
    Prompts can use `script({ ... })` to configure UI elements like `title`,
    `description`, and `group`. This is optional but must use valid JSON5.


    `title`, `description`, and `group` define how the prompt appears in the UI.
    Example:

    ```javascript

    script({
        title: "Shorten",
        description: "Shrinks text size without losing meaning",
        group: "shorten",
    })

    ```


    `system` overrides default system prompts:

    ```javascript

    script({
        system: ["system.files"],
    })

    ```


    `model` specifies the LLM identifier. Use `large` or `small` for defaults:

    ```javascript

    script({
        model: "openai:gpt-4o",
    })

    ```


    `maxTokens` sets the maximum completion tokens:

    ```javascript

    script({
        maxTokens: 2000,
    })

    ```


    `maxToolCalls` limits function/tool calls to prevent infinite loops:

    ```javascript

    script({
        maxToolCalls: 100,
    })

    ```


    `temperature` adjusts randomness (0-2, default 0.8):

    ```javascript

    script({
        temperature: 0.8,
    })

    ```


    `top_p` sets nucleus sampling probability:

    ```javascript

    script({
        top_p: 0.5,
    })

    ```


    `seed` sets a fixed seed for reproducibility:

    ```javascript

    script({
        seed: 12345678,
    })

    ```


    `metadata` adds key-value pairs for stored completions:

    ```javascript

    script({
        metadata: { name: "my_script" }
    })

    ```


    Retry options improve reliability for failed requests:

    ```javascript

    script({
        retries: 3,
        retryDelay: 1000,
        maxDelay: 5000,
        maxRetryAfter: 10000,
        retryOn: [429, 500, 502, 503, 504],
    })

    ```

    Retries handle rate limits (429), server errors (5xx), and network failures.
    Overrides are possible in `runPrompt()`:

    ```javascript

    const { text } = await runPrompt(
        (_) => _.$`Summarize this text.`,
        { model: "small", retries: 2, retryDelay: 500, maxDelay: 3000 }
    )

    ```


    `unlisted: true` hides prompts from user lists. Use `env.meta` to access
    script metadata:

    ```javascript

    const { model } = env.meta

    ```


    `host.resolveModel` resolves model aliases:

    ```javascript

    const info = await host.resolveModel("large")

    console.log(info)

    ```

    Returns provider and model details:

    ```json

    { "provider": "openai", "model": "gpt-4o" }

    ```
  hash: 6aadfa1351fc51ed8fa13ff65a71a8f74a19a91b881209fec945065977ba629a

---

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

You can define **model aliases** in your project to give friendly names to models and abstract away from a particular model version/tag.

So instead of hard-coding a model type,

```js 'model: "openai:gpt-4o"'
script({
    model: "openai:gpt-4o",
})
```

You can use/define an alias like `large`.

```js 'model: "large"'
script({
    model: "large",
})
```

Model aliases can be defined as environment varialbles (through the `.env` file),
in a configuration file or through the [cli](/genaiscript/reference/cli/run).

This `.env` file defines a `llama32` alias for the `ollama:llama3.2:1b` model.

```txt title=".env"
GENAISCRIPT_MODEL_LLAMA32="ollama:llama3.2:1b"
```

You can then use the `llama32` alias in your scripts.

```js 'model: "llama32"'
script({
    model: "llama32",
})
```

## Defining aliases

The following configuration are support in order importance (last one wins):

- [configuration file](/genaiscript/reference/configuration-files) with the `modelAliases` field

```json title="genaiscript.config.json"
{
    "modelAliases": {
        "llama32": "ollama:llama3.2:1b"
    }
}
```

- environment variables with keys of the pattern `GENAISCRIPT_MODEL_ALIAS=...`
- [cli](/genaiscript/reference/cli/run) with the `--model-alias` flag

```sh
genaiscript run --model-alias llama32=ollama:llama3.2:1b
```

## Alias of aliases

An model alias can reference another alias as long as cycles are not created.

```json title="genaiscript.config.json"
{
    "modelAliases": {
        "llama32": "ollama:llama3.2:1b",
        "llama": "llama32"
    }
}
```

## Builtin aliases

By default, GenAIScript supports the following model aliases, and various candidates
in different LLM providers.

- `large`: `gpt-4o like` model
- `small`: `gpt-4o-mini` model or similar. A smaller, cheaper faster model
- `vision`: `gpt-4o-mini`. A model that can analyze images
- `reasoning`: `o1` or `o1-preview`.
- `reasoning_small`: `o1-mini`.

The following aliases are also set so that you can override LLMs used by GenAIScript itself.

- `agent`: `large`. Model used by the Agent LLM.
- `memory`: `small`. Moel used by the agent short term memory.

The default aliases for a given provider can be loaded using the `provider` option in the [cli](/genaiscript/reference/cli/run).

```sh
genaiscript run --provider anthropic
```
The OpenAI reasoning models, the `o1, o3` models, DeepSeek R1 or Anthropic Sonet 3.7, are models that are optimized for reasoning tasks.

```js
script({
    model: "openai:o1",
})
```

:::tip

You can experiement with these models on Github Models as well but the context window is quite small.

```js
script({
    model: "github:o3-mini",
})
```

:::

## Model Alias

The `reasoning` and `reasoning-small` [model aliases](/genaiscript/reference/scripts/model-aliases) are available for reasoning models.

```js
script({
    model: "openai:reasoning",
})
```

or

```sh
genaiscript run ... -p openai -m reasoning
```

## Reasonong, thinking

GenAIScript automatically extracts the thinking/reasoning content of the LLM responses.

## Reasoning effort

The reasoning effort parameter can be set to `low`, `medium`, or `high`.

- configured with the `reasoningEffort` parameter

```js 'reasoningEffort: "high"'
script({
    model: "openai:o3-mini"
    reasoningEffort: "high"
})
```

- as a tag to the model name

```js 'openai:o3-mini:high'
script({
    model: "openai:o3-mini:high",
})
```

For Anthropic Sonnet 3.7, the reasoning efforts are mapped to the following `budget_token` values:

- low: 2048
- medium: 4096
- high: 16384

## Limitations

- `o1-preview`, `o1-mini` do not support streaming
- `o1` models do not support tool calling so GenAIScript uses [fallback tools](/genaiscript/reference/scripts/tools).

## Advice on prompting

OpenAI provides an extensive [advice on prompting](https://platform.openai.com/docs/guides/reasoning#advice-on-prompting)
reasoning models.
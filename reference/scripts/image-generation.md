GenAIScript support LLM providers with [OpenAI-compatible image generation APIs](https://platform.openai.com/docs/guides/images).

## Supported providers

You will need to configure a LLM provider that support image generation.

- [OpenAI](/genaiscript/getting-started/configuration/#openai)
- [Azure OpenAI](/genaiscript/getting-started/configuration/#azure-openai)
- [Azure AI Foundry](/genaiscript/getting-started/configuration/#azure-ai-inference)

## Generate an image

The top-level script (main) cannot be configured to generate an image at the moment; it has be done a function call to `generateImage`.

`generateImage` takes a prompt and returns an image URL and a revised prompt (optional).

```js "generateImage" wrap
const { image, revisedPrompt } = await generateImage(
    `a cute cat. only one. photographic, high details. 4k resolution.`
)
```

The `image` object is an image file that can be passed around for further processing.

```js
env.output.image(image.filename)
```
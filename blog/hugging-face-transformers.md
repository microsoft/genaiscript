import BlogNarration from "../../../components/BlogNarration.astro";

<BlogNarration />

<p style="text-align:center">
  <span style="font-size: 12rem;">🤗</span>
</p>

:::caution

We have temporarily removed support for the `transformers` model provider in GenAIScript to reduce
the installation footprint.

:::

[Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/index)
is a JavaScript library that provides a simple way to run LLMs in the browser or node.js (or Bun, Deno, ...).

```js 'model: "transformers:HuggingFaceTB/SmolLM2-1.7B-Instruct:q4f16"'
script({
  model:
    "transformers:HuggingFaceTB/SmolLM2-1.7B-Instruct:q4f16",
});
```

GenAIScript will download and cache the model for you, and you can start using it right away
**fully locally**.

There are [plenty of models](https://huggingface.co/models?pipeline_tag=text-generation&library=transformers.js) to choose from and you can also follow the Hugging Face documentation to fine tune your own.
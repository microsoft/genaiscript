import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

<p style="text-align:center">
  <span style="font-size: 12rem;">🤗</span>
</p>

:::caution
Nous avons temporairement supprimé la prise en charge du fournisseur de modèles `transformers` dans GenAIScript afin de réduire l'empreinte d'installation.
:::

[Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js/index) est une bibliothèque JavaScript qui offre un moyen simple d'exécuter des LLMs dans le navigateur ou dans node.js (ou Bun, Deno, ...).

```js 'model: "transformers:HuggingFaceTB/SmolLM2-1.7B-Instruct:q4f16"'
script({
  model:
    "transformers:HuggingFaceTB/SmolLM2-1.7B-Instruct:q4f16",
});
```

GenAIScript téléchargera et mettra en cache le modèle pour vous, et vous pourrez commencer à l'utiliser immédiatement **complètement localement**.

Il existe [de nombreux modèles](https://huggingface.co/models?pipeline_tag=text-generation\&library=transformers.js) parmi lesquels choisir, et vous pouvez également suivre la documentation de Hugging Face pour affiner le vôtre.
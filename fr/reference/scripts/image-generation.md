GenAIScript prend en charge les fournisseurs de modèles de langage (LLM) avec des [API de génération d'images compatibles avec OpenAI](https://platform.openai.com/docs/guides/images).

## Fournisseurs supportés

Vous devrez configurer un fournisseur de LLM prenant en charge la génération d'images.

* [OpenAI](../../../reference/configuration/openai/)
* [Azure OpenAI](../../../reference/configuration/azure-openai/)
* [Azure AI Foundry](../../../reference/configuration/azure-ai-foundry/)

## Générer une image

Le script principal (top-level) ne peut pas être configuré pour générer une image pour l'instant ; cela doit être fait via un appel à la fonction `generateImage`.

`generateImage` prend une commande (prompt) et retourne une URL d'image ainsi qu'une commande révisée (optionnelle).

```js "generateImage" wrap
const { image, revisedPrompt } = await generateImage(
    `a cute cat. only one. photographic, high details. 4k resolution.`
)
```

L'objet `image` est un fichier image qui peut être utilisé pour d'autres traitements.

```js
env.output.image(image.filename)
```
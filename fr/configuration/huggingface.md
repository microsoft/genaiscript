import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

Le fournisseur `huggingface` vous permet d'utiliser les [modèles Hugging Face](https://huggingface.co/models?other=text-generation-inference) via [Text Generation Inference](https://huggingface.co/docs/text-generation-inference/index).

```js "huggingface:"
script({
  model: "huggingface:microsoft/Phi-3-mini-4k-instruct",
});
```

Pour utiliser les modèles Hugging Face avec GenAIScript, suivez ces étapes :

<Steps>
  <ol>
    <li>
      Inscrivez-vous pour un [compte Hugging Face](https://huggingface.co/) et obtenez une clé API depuis leur [console](https://huggingface.co/settings/tokens).
      Si vous créez un token **Fined Grained**, activez l'option **Make calls to the serverless inference API**.
    </li>

    <li>
      Ajoutez votre clé API Hugging Face au fichier `.env`
      en tant que variables `HUGGINGFACE_API_KEY`, `HF_TOKEN` ou `HUGGINGFACE_TOKEN`.

      ```txt title=".env"
      HUGGINGFACE_API_KEY=hf_...
      ```
    </li>

    <li>
      Trouvez le modèle qui correspond le mieux à vos besoins en visitant les [modèles HuggingFace](https://huggingface.co/models?other=text-generation-inference).
    </li>

    <li>
      Mettez à jour votre script pour utiliser le `model` de votre choix.

      ```js
      script({
          ...
          model: "huggingface:microsoft/Phi-3-mini-4k-instruct",
      })
      ```
    </li>
  </ol>
</Steps>

:::note
Certains modèles peuvent nécessiter un compte Pro.
:::

### Journalisation

Vous pouvez activer les [espaces de noms de journalisation](../../reference/scripts/logging/) `genaiscript:huggingface` et `genaiscript:huggingface:msg` pour obtenir plus d'informations sur les requêtes et réponses :

<LLMProviderFeatures provider="huggingface" />
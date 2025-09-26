import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

## Google IA <a href="" id="google" />

Le fournisseur `google` vous permet d'utiliser les modèles Google AI. Il vous donne accès

:::note
GenAIScript utilise la couche de [compatibilité OpenAI](https://ai.google.dev/gemini-api/docs/openai) de Google AI, donc certaines [limitations](https://ai.google.dev/gemini-api/docs/openai#current-limitations) s'appliquent.

* `seed` n'est pas pris en charge et est ignoré.
* Les [outils de secours](../../reference/scripts/tools#fallbacktools/) sont activés en utilisant Google pour compléter la couche de compatibilité OpenAI. (Voir [forum](https://discuss.ai.google.dev/t/gemini-openai-compatibility-multiple-functions-support-in-function-calling-error-400/49431)).
:::

<Steps>
  <ol>
    <li>
      Ouvrez [Google AI Studio](https://aistudio.google.com/app/apikey) et créez une nouvelle clé API.
    </li>

    <li>
      Mettez à jour le fichier `.env` avec la clé API.

      ```txt title=".env"
      GEMINI_API_KEY=...
      ```
    </li>

    <li>
      Trouvez l'identifiant du modèle dans la [documentation Gemini](https://ai.google.dev/gemini-api/docs/models/gemini) et utilisez-le dans votre script ou CLI avec le fournisseur `google`.

      ```py "gemini-1.5-pro-002"
      ...
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
      });
      ...
      ```

      puis utilisez l'identifiant du modèle dans votre script.

      ```js "gemini-1.5-pro-latest"
      script({ model: "google:gemini-1.5-pro-latest" });
      ```
    </li>
  </ol>
</Steps>

<LLMProviderFeatures provider="google" />
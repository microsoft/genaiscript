import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

import oaiModelsSrc from "../../../../assets/openai-model-names.png";
import oaiModelsAlt from "../../../../assets/openai-model-names.png.txt?raw";

`openai` est le fournisseur de modèle de chat OpenAI.
Il utilise les variables d'environnement `OPENAI_API_...`.

<Steps>
  <ol>
    <li>
      [Mettez à niveau votre compte](https://platform.openai.com/settings/organization/billing/overview) pour accéder aux modèles.
      Vous obtiendrez des erreurs 404 si vous n'avez pas de compte payant.
    </li>

    <li>
      Créez une nouvelle clé secrète depuis le [portail des clés API OpenAI](https://platform.openai.com/api-keys).
    </li>

    <li>
      Mettez à jour le fichier `.env` avec la clé secrète.

      ```txt title=".env"
      OPENAI_API_KEY=sk_...
      ```
    </li>

    <li>
      Trouvez le modèle que vous souhaitez utiliser
      dans la [référence API OpenAI](https://platform.openai.com/docs/models/gpt-4o)
      ou dans le [Playground de chat OpenAI](https://platform.openai.com/playground/chat).

      <Image src={oaiModelsSrc} alt={oaiModelsAlt} loading="lazy" />
    </li>

    <li>
      Définissez le champ `model` dans le `script` au modèle que vous voulez utiliser.

      ```js 'model: "openai:gpt-4o"'
      script({
          model: "openai:gpt-4o",
          ...
      })
      ```
    </li>
  </ol>
</Steps>

:::tip[Configuration par défaut du modèle]
Utilisez `GENAISCRIPT_MODEL_LARGE` et `GENAISCRIPT_MODEL_SMALL` dans votre fichier `.env` pour définir le modèle par défaut et le modèle léger.

```txt
GENAISCRIPT_MODEL_LARGE=openai:gpt-4o
GENAISCRIPT_MODEL_SMALL=openai:gpt-4o-mini
```
:::

## Journalisation

Vous pouvez activer les [espaces de noms de journalisation](../../reference/scripts/logging/) `genaiscript:openai` et `genaiscript:openai:msg` pour obtenir plus d'informations sur les requêtes et réponses :

<LLMProviderFeatures provider="openai" />
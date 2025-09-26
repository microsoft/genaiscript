import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

`deepseek` est le fournisseur de modèle de chat [DeepSeek (https://www.deepseek.com/)](https://www.deepseek.com/).
Il utilise les variables d'environnement `DEEPSEEK_API_...`.

<Steps>
  <ol>
    <li>
      Créez une nouvelle clé secrète depuis le [portail des clés API DeepSeek](https://platform.deepseek.com/usage).
    </li>

    <li>
      Mettez à jour le fichier `.env` avec la clé secrète.

      ```txt title=".env"
      DEEPSEEK_API_KEY=sk_...
      ```
    </li>

    <li>
      Définissez le champ `model` dans `script` à `deepseek:deepseek:deepseek-chat` qui est actuellement le seul modèle supporté.

      ```js 'model: "deepseek:deepseek-chat"'
      script({
          model: "deepseek:deepseek-chat",
          ...
      })
      ```
    </li>
  </ol>
</Steps>

<LLMProviderFeatures provider="deepseek" />
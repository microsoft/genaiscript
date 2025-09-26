import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

[LocalAI](https://localai.io/) agit comme une API REST de remplacement prête à l’emploi, compatible avec les spécifications de l’API OpenAI pour l’inférence locale. Il utilise des modèles Open Source gratuits et fonctionne sur des CPU.

LocalAI agit comme un remplacement d’OpenAI, vous pouvez consulter le [mapping des noms de modèles](https://localai.io/basics/container/#all-in-one-images) utilisé dans le conteneur, par exemple `gpt-4` est mappé à `phi-2`.

<Steps>
  <ol>
    <li>
      Installez Docker. Voir la [documentation LocalAI](https://localai.io/basics/getting_started/#prerequisites) pour plus d’informations.
    </li>

    <li>
      Mettez à jour le fichier `.env` et définissez le type d’API à `localai`.

      ```txt title=".env" "localai"
      OPENAI_API_TYPE=localai
      ```
    </li>
  </ol>
</Steps>

Pour démarrer LocalAI dans Docker, exécutez la commande suivante :

```sh
docker run -p 8080:8080 --name local-ai -ti localai/localai:latest-aio-cpu
docker start local-ai
docker stats
echo "LocalAI is running at http://127.0.0.1:8080"
```
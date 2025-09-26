import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

[LLaMA.cpp](https://github.com/ggerganov/llama.cpp/tree/master/examples/server)
permet également d'exécuter des modèles localement ou d'interfacer avec d'autres fournisseurs de LLM.

<Steps>
  <ol>
    <li>
      Mettez à jour le fichier `.env` avec les informations du serveur local.

      ```txt title=".env"
      OPENAI_API_BASE=http://localhost:...
      ```
    </li>
  </ol>
</Steps>
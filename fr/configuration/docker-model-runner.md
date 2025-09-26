import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

Le fournisseur `docker` se connecte au serveur local [Docker Model Runner](https://docs.docker.com/model-runner/).
Il suppose que GenAIScript s'exécute dans un conteneur et utilise par défaut le point de terminaison `http://model-runner.docker.internal/engines/v1/`.

<Steps>
  <ol>
    <li>
      Installez [Docker](https://docs.docker.com/)
    </li>
  </ol>
</Steps>

Pour utiliser les modèles Docker Model Runner, utilisez la syntaxe `docker:modelid`.
Si vous changez l'URL du serveur par défaut, vous pouvez définir la variable d'environnement `DOCKER_MODEL_RUNNER_API_BASE`.

```txt title=".env"
DOCKER_MODEL_RUNNER_API_BASE=...
```

<LLMProviderFeatures provider="docker" />
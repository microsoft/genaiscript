import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

Le fournisseur [GitHub Models](https://github.com/marketplace/models), `github`, permet d’exécuter des modèles via le GitHub Marketplace.\
Ce fournisseur est utile pour le prototypage et est soumis à des [limites de taux](https://docs.github.com/en/github-models/prototyping-with-ai-models#rate-limits)\
selon votre abonnement.

```js "github:"
script({ model: "github:openai/gpt-4o" });
```

### Configuration de Codespace

Si vous utilisez un [GitHub Codespace](https://github.com/features/codespaces), le token est déjà configuré pour vous...\
Ça fonctionne simplement.

### Configuration de GitHub Actions

Depuis [avril 2025](https://github.blog/changelog/2025-04-14-github-actions-token-integration-now-generally-available-in-github-models/),\
vous pouvez utiliser le token GitHub Actions (`GITHUB_TOKEN`) pour appeler des modèles d’IA directement dans vos workflows.

<Steps>
  <ol>
    <li>
      Assurez-vous que la permission `models` est activée dans la configuration de votre workflow.

      ```yaml title="genai.yml" "models: read"
      permissions:
        models: read
      ```
    </li>

    <li>
      Passez le `GITHUB_TOKEN` lors de l’exécution de `genaiscript`

      ```yaml title="genai.yml" "GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}"
      run: npx -y genaiscript run ...
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      ```
    </li>
  </ol>
</Steps>

Pour en savoir plus, consultez la [Documentation GitHub](https://docs.github.com/en/github-models/integrating-ai-models-into-your-development-workflow#using-ai-models-with-github-actions)

### Configurer avec votre propre token

Si vous n’utilisez pas GitHub Actions ou Codespaces, vous pouvez utiliser votre propre token pour accéder aux modèles.

<Steps>
  <ol>
    <li>
      Créez un [token d’accès personnel GitHub](https://github.com/settings/tokens/new).\
      Le token ne doit pas avoir de scopes ou permissions.
    </li>

    <li>
      Mettez à jour le fichier `.env` avec le token.

      ```txt title=".env"
      GITHUB_TOKEN=...
      ```
    </li>
  </ol>
</Steps>

Pour configurer un modèle spécifique,

<Steps>
  <ol>
    <li>
      Ouvrez le [GitHub Marketplace](https://github.com/marketplace/models) et trouvez le modèle que vous souhaitez utiliser.
    </li>

    <li>
      Copiez le nom du modèle à partir des exemples Javascript/Python

      ```js "Phi-3-mini-4k-instruct"
      const modelName = "microsoft/Phi-3-mini-4k-instruct";
      ```

      pour configurer votre script.

      ```js "microsoft/Phi-3-mini-4k-instruct"
      script({
        model: "github:microsoft/Phi-3-mini-4k-instruct",
      });
      ```
    </li>
  </ol>
</Steps>

Si vous utilisez déjà la variable `GITHUB_TOKEN` dans votre script et avez besoin d’un token différent\
pour GitHub Models, vous pouvez utiliser la variable `GITHUB_MODELS_TOKEN` à la place.

### Modèles `o1-preview` et `o1-mini`

Actuellement, ces modèles ne supportent pas le streaming ni les invites système.\
GenAIScript gère cela en interne.

```js "github:openai/o1-mini"
script({
  model: "github:openai/o1-mini",
});
```

<LLMProviderFeatures provider="github" />
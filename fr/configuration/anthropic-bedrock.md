import { FileTree } from "@astrojs/starlight/components";
import { Steps } from "@astrojs/starlight/components";
import { Tabs, TabItem } from "@astrojs/starlight/components";
import { Image } from "astro:assets";
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

Le fournisseur `anthropic_bedrock` accède aux modèles Anthropic sur Amazon Bedrock. Vous pouvez trouver les noms des modèles dans la [documentation des modèles Anthropic](https://docs.anthropic.com/en/docs/about-claude/models#model-names).

GenAIScript suppose que vous avez configuré les identifiants Amazon Web Services (AWS)
d’une manière que le [SDK AWS Node reconnaîtra](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html).

```js "anthropic_bedrock:"
script({
  model:
    "anthropic_bedrock:anthropic.claude-3-sonnet-20240229-v1:0",
});
```
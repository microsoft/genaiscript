import { FileTree } from "@astrojs/starlight/components"
import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"
import { Image } from "astro:assets"
import { YouTube } from "astro-embed"
import LLMProviderFeatures from "../../../../components/LLMProviderFeatures.astro";

import lmSrc from "../../../../assets/vscode-language-models.png";
import lmAlt from "../../../../assets/vscode-language-models.png.txt?raw";

import lmSelectSrc from "../../../../assets/vscode-language-models-select.png";
import lmSelectAlt from "../../../../assets/vscode-language-models-select.png.txt?raw";

import oaiModelsSrc from "../../../../assets/openai-model-names.png";
import oaiModelsAlt from "../../../../assets/openai-model-names.png.txt?raw";

import {
    AZURE_OPENAI_API_VERSION,
    AZURE_AI_INFERENCE_VERSION,
} from "../../../../../../packages/core/src/constants";

Vous devrez [configurer](../../configuration/) la connexion LLM et les secrets d'autorisation.
Vous pouvez utiliser des modèles distants (comme OpenAI, Azure, etc.) et des modèles locaux (comme Ollama, Jan, LMStudio, etc.) avec GenAIScript.

Il existe quelques raccourcis où GenAIScript détectera automatiquement la configuration ; sinon, vous devrez suivre [les instructions de configuration](../../configuration/).

* dans Visual Studio Code avec GitHub Copilot Chat installé, GenAIScript utilisera automatiquement les modèles Copilot Chat
* dans un GitHub Codespace, GenAIScript utilisera automatiquement les modèles GitHub
* si Ollama fonctionne, GenAIScript utilisera automatiquement les modèles Ollama

**Si aucun de ces scénarios ne s'applique, suivez [les instructions de configuration](../../configuration/).**

## Étapes suivantes

Écrivez votre [premier script](../../getting-started/your-first-genai-script/).
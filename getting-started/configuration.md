import { FileTree } from "@astrojs/starlight/components"
import { Steps } from "@astrojs/starlight/components"
import { Tabs, TabItem } from "@astrojs/starlight/components"
import { Image } from "astro:assets"
import { YouTube } from "astro-embed"
import LLMProviderFeatures from "../../../components/LLMProviderFeatures.astro"

import lmSrc from "../../../assets/vscode-language-models.png"
import lmAlt from "../../../assets/vscode-language-models.png.txt?raw"

import lmSelectSrc from "../../../assets/vscode-language-models-select.png"
import lmSelectAlt from "../../../assets/vscode-language-models-select.png.txt?raw"

import oaiModelsSrc from "../../../assets/openai-model-names.png"
import oaiModelsAlt from "../../../assets/openai-model-names.png.txt?raw"

import {
    AZURE_OPENAI_API_VERSION,
    AZURE_AI_INFERENCE_VERSION,
} from "../../../../../packages/core/src/constants"

You will need to [configure](/genaiscript/configuration) the LLM connection and authorization secrets.
You can use remote (like OpenAI, Azure, etc.) and local models (like Ollama, Jan, LMStudio, etc.) with GenAIScript.

There are a few shortcuts where GenAIScript will automatically detect
the configuration; otherwise, you'll want to follow [the configuration instructions](/genaiscript/configuration).

- in Visual Studio Code with GitHub Copilot Chat installed, GenAIScript will automatically use the Copilot Chat models
- in a GitHub Codespace, GenAIScript will automatically use GitHub Models
- if Ollama is running, GenAIScript will automatically use the Ollama models

**If none of these scenario apply, follow [the configuration instructions](/genaiscript/configuration).**

## Next steps

Write your [first script](/genaiscript/getting-started/your-first-genai-script).
import { Code } from "@astrojs/starlight/components";
import { YouTube } from "astro-embed";
import BlogNarration from "../../../../components/BlogNarration.astro";

<BlogNarration />

:::note
Visual Studio Code v100 a légèrement modifié la façon d'ajouter l'invite `genaiscript` à la session de chat.

* [Suivez ce guide](../../reference/vscode/github-copilot-chat/#genaiscript-custom-prompt/)
:::

Connaissez-vous une astuce géniale pour faire de GitHub Copilot Chat un expert en GenAIScript ?
Voici comment vous pouvez booster votre chat Copilot avec une technique simple.

**Ajoutez toute votre documentation à la session de chat !**

Ça paraît fou ? Pas vraiment ! GenAIScript contient d'innombrables exemples d'utilisation des API. Il suffit de compresser
la documentation pour qu'elle tienne dans la fenêtre de contexte.

## Comment puis-je essayer cela ?

Avec la dernière version de GenAIScript, vous pouvez désormais ajouter une invite **`genaiscript`** à votre session de chat.
Cette invite, créée par l'équipe GenAIScript, inclura la documentation GenAIScript
dans le contexte pour aider le fournisseur de LLM à mieux répondre.

<YouTube id="https://youtu.be/0GkbxnW0J34" posterQuality="high" />

* [Suivez ce guide](../../reference/vscode/github-copilot-chat/#genaiscript-custom-prompt/)

## Comment cela fonctionne-t-il ?

La dernière version de GitHub Copilot Chat ajoute la prise en charge des [prompts réutilisables](https://code.visualstudio.com/docs/copilot/copilot-customization#_reusable-prompt-files-experimental).
GitHub Copilot Chat a également ajouté la prise en charge de l'indexation locale de l'espace de travail, ce qui aide à gérer de grandes quantités de contexte.

GenAIScript tire parti de ces fonctionnalités en ajoutant un prompt personnalisé qui inclut la documentation GenAIScript.

## À suivre

Cette technique est vraiment nouvelle et il y a probablement beaucoup d'améliorations à apporter.
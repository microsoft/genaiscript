import WarningCode from "../../../../components/WarningCode.astro";

Nous discutons des différents risques de sécurité et des stratégies d'atténuation lors de l'utilisation de GenAIScript.
GenAIScript hérite des mêmes risques de sécurité que l'exécution de scripts, et ajoute de nouvelles menaces dues à la nature des sorties générées par le LLM.

Nous recommandons également de lire la [Note de transparence](../../reference/transparency-note/)
pour comprendre les capacités et les limitations de GenAIScript.

## Ne faites pas confiance aux scripts

Étant donné que les fichiers GenAIScript `.genai.mjs` sont des fichiers JavaScript exécutables et utilisent en réalité un environnement d'exécution JavaScript (VSCode ou Node), il est essentiel de comprendre que le script peut faire tout ce que JavaScript peut faire. Cela inclut la lecture et l’écriture de fichiers, la réalisation de requêtes réseau, et l’exécution de code JavaScript arbitraire.

:::caution
Ne pas exécuter les scripts `.genai.mjs` provenant de sources non fiables.
:::

## Ne faites pas confiance aux sorties de LLM

Un script de confiance pourrait utiliser des fichiers malveillants du contexte pour générer une sortie malveillante. Par exemple, en substituant des fichiers dans le projet avec un nouveau code malveillant.

<WarningCode />

* dans Visual Studio Code, utilisez l’aperçu de refactorisation
* dans votre CI/CD, créez une demande de tirage avec les modifications et examinez-les

## Confiance de l’espace de travail dans Visual Studio Code

L’extension est **désactivée** lors de l’ouverture d’un dossier en [Mode Restreint](https://code.visualstudio.com/docs/editor/workspace-trust) dans Visual Studio Code.

## Aperçu Markdown dans Visual Studio Code

La sortie du LLM et la trace utilisent l'aperçu Markdown intégré de Visual Studio Code.
Par défaut, [VS Code limite le contenu affiché dans l'aperçu Markdown](https://code.visualstudio.com/Docs/languages/markdown#_markdown-preview-security).
Cela inclut la désactivation de l'exécution de script et n'autorise le chargement des ressources que via `https`.
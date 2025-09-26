import { FileTree } from "@astrojs/starlight/components";
import DirectoryLinks from "../../../../../components/DirectoryLinks.astro";

GenAIScript sont des fichiers JavaScript nommés `*.genai.mjs` ou des fichiers TypeScript nommés `*.genai.mts`, avec un moteur de création d'invites conçu pour les LLM.

```js title="shorten.genai.mjs"
script({
  title: "Shorten", // displayed in UI and Copilot Chat
  // also displayed but grayed out:
  description:
    "A prompt that shrinks the size of text without losing meaning",
});

// but the variable is appropriately delimited
const file = def("FILE", env.files);

// this appends text to the prompt
$`Shorten ${file}. Limit changes to minimum.`;
```

## Fichiers Script

* GenAIScript détectera tout fichier correspondant à `*.genai.mjs`, `*.genai.js`, `*.genai.mts` dans votre espace de travail.
* Les fichiers GenAIScript peuvent être placés n'importe où dans votre espace de travail ; cependant, l'extension les placera par défaut dans un dossier `genaisrc`.
* `.genai.mjs` utilise la syntaxe de module JavaScript et prend en charge les [imports](../../../reference/reference/scripts/imports/).
* `.genai.js` sont évalués et ne prennent pas en charge les imports.
* `.genai.mts` sont des [fichiers module TypeScript](../../../reference/reference/scripts/typescript/) et prennent en charge les [imports](../../../reference/reference/scripts/imports/), y compris les imports dynamiques d'autres fichiers TypeScript.

<FileTree>
  - /genaisrc
    * jsconfig.json // Configuration du compilateur TypeScript
    * genaiscript.d.ts // Définitions TypeScript
    * myscript.genai.mjs // votre script !
    * ...
</FileTree>

* `system.*.genai.mjs` sont considérés comme des [modèles d'invites système](../../../reference/reference/scripts/system/) et ne sont pas listés par défaut.

## Sujets

<DirectoryLinks directory="reference/scripts" />
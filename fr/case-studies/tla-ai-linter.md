import { Image } from "astro:assets";
import { Code } from "@astrojs/starlight/components";
import specSource from "../../../../../../samples/sample/src/tla/EWD998PCal.tla?raw";
import actionSource from "../../../../../../samples/sample/src/tla/PR.yml?raw";
import scriptSource from "../../../../../../samples/sample/src/tla/tlAI-Linter.genai.js?raw";
import src from "../../../../assets/tla-ai-linter.png";
import alt from "../../../../assets/tla-ai-linter.png.txt?raw";

[TLA+](https://lamport.azurewebsites.net/tla/tla.html) est un langage de haut niveau pour modéliser des programmes et des systèmes—en particulier les systèmes concurrents et distribués. Il repose sur l'idée que la meilleure façon de décrire précisément les choses est d'utiliser des mathématiques simples.

TLA+ n'est pas fourni avec un linter ou un formateur traditionnel. Le TLA+ AI Linter est un script GenAI qui utilise des LLMs pour analyser les fichiers TLA+.

## Spécifications TLA+

Voici une spécification TLA+ qui modélise une solution fondamentale au [problème de détection de terminaison dans les systèmes distribués](https://www.cs.utexas.edu/users/EWD/ewd09xx/EWD998.PDF).

<Code code={specSource} wrap={true} lang="txt" title="EWD998PCal.tla" />

## Script

Le script GenAI suivant va effectuer le linting de la spécification TLA+ ci-dessus. Plus précisément, il va vérifier si les commentaires en prose dans la spécification sont cohérents avec les définitions TLA+.

<Code code={scriptSource} wrap={true} lang="js" title="tlAI-Linter.genai.mjs" />

* des numéros de ligne sont ajoutés au contenu du fichier pour aider le LLM à localiser précisément les problèmes.

```js "lineNumbers" wrap
def(
  "TLA+",
  env.files.filter((f) => f.filename.endsWith(".tla")),
  { lineNumbers: true },
);
```

* le script utilise un support intégré pour les [annotations](../../reference/scripts/annotations/) afin de générer des avertissements et erreurs analysables. Les annotations sont automatiquement intégrées comme problèmes dans VSCode ou comme erreurs de compilation dans la chaîne CI/CD.

```js "annotations"
$`Report inconsistent and consistent pairs in a single ANNOTATION section.`;
```

* GPT-4 connaît déjà beaucoup de choses sur la logique et les mathématiques de base. Cependant, le script énumère également des idiomes TLA+ courants qui sont pertinents pour l'analyse d'une spécification.

## Github Action

<Code code={actionSource} wrap={true} lang="yaml" title="PR.yml" />

* après avoir cloné le dépôt et installé des dépendances telles que node.js, le script GenAI est exécuté pour analyser les spécifications TLA+ qui ont été ajoutées ou modifiées dans la Pull Request.

* La sortie du script, c’est-à-dire les annotations générées par le LLM, est formatée comme un rapport [SARIF](https://sarifweb.azurewebsites.net) et [téléversée](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github) dans la Pull Request.

## Résultats

Le linter a généré des annotations pour chaque commentaire en prose dans la spécification, et un commentaire a été identifié comme incohérent par rapport aux définitions TLA+. Un avertissement correspondant est ajouté à la PR.

<Image src={src} alt={alt} />
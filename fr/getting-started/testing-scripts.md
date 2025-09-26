import { Image } from "astro:assets"
import testExplorerSrc from "../../../../assets/vscode-test-explorer.png";
import testExplorerAlt from "../../../../assets/vscode-test-explorer.png.txt?raw";

Il est possible de déclarer des [tests](../../reference/scripts/tests/) dans la fonction `script` pour valider la sortie du script.

## Déclaration des tests

Les tests sont ajoutés sous forme d'un tableau d'objets dans la clé `tests` de la fonction `script`.

```js title="proofreader.genai.mjs" wrap
script({
  ...,
  tests: {
    files: "src/rag/testcode.ts",
    rubrics: "is a report with a list of issues",
    facts: `The report says that the input string
      should be validated before use.`,
  }
})
```

## Spécification des modèles

Vous pouvez également spécifier un ensemble de modèles (et d'alias de modèles) pour exécuter les tests. Chaque test sera exécuté pour chaque modèle.

```js title="proofreader.genai.mjs" wrap
script({
  ...,
    testModels: [
        "azure_ai_inference:gpt-4o",
        "azure_ai_inference:gpt-4o-mini",
        "azure_ai_inference:deepseek-r1",
    ],
})
```

Les `testModels` peuvent aussi être remplacés via la ligne de commande.

## Exécution des tests

### Visual Studio Code

* Ouvrez la [vue Test Explorer](https://code.visualstudio.com/docs/python/testing).
* Sélectionnez votre script dans l'arborescence et cliquez sur le bouton avec l'icône `play`.

<Image src={testExplorerSrc} alt={testExplorerAlt} loading="lazy" />

### Ligne de commande

Exécutez cette commande depuis la racine de l'espace de travail.

```sh
npx genaiscript test proofreader
```

## Limitations connues

Actuellement, promptfoo considère la source du script comme le texte de l'invite. Par conséquent, il n'est pas possible d'utiliser des assertions qui dépendent également du texte d'entrée, comme `answer_relevance`.

* En savoir plus sur les [tests](../../reference/scripts/tests/) dans la référence.

## Étapes suivantes

[Automatisez](../../getting-started/automating-scripts/) l'exécution de scripts en utilisant l'interface en ligne de commande ([CLI](../../reference/cli/)).
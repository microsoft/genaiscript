import { YouTube } from "astro-embed"
import { Code } from "@astrojs/starlight/components"
import summaryOfSummaryPhi3 from "../../../../../../../samples/sample/genaisrc/summary-of-summary.genai.js?raw";

La fonction `prompt` ou `runPrompt` permet de construire une invocation interne de LLM. Elle retourne le résultat de l'invite.

<YouTube id="https://youtu.be/lnjvPVXgC9k" posterQuality="high" />

`prompt` est une simplification syntaxique pour `runPrompt` qui utilise un littéral de chaîne de caractères comme texte d'invite.

```js
const { text } = await prompt`Write a short poem.`
```

Vous pouvez passer une fonction à `runPrompt` prenant un seul argument `_`, qui est le générateur d'invite.
Il utilise les mêmes aides comme `$`, `def`, mais s'applique à l'invite interne.

```js
const { text } = await runPrompt((_) => {
    // use def, $ and other helpers
    _.def("FILE", file)
    _.$`Summarize the FILE. Be concise.`
})
```

Vous pouvez également simplifier la fonction et passer directement le texte de l'invite.

```js
const { text } = await runPrompt(
    `Select all the image files in ${env.files.map((f) => f.filename)}`
)
```

## Ne mélangez pas les aides globales dans les invites internes

:::tip
C'est une erreur très courante lors de l'utilisation des invites internes.
:::

Une erreur fréquente est d'utiliser les aides globales `def`, `$` et autres dans l'invite interne.
Ces aides ne sont pas disponibles dans l'invite interne, et vous devez utiliser `_.$`, `_.def` et les autres aides spécifiques.

* **pas bien**

```js "def"
const { text } = await runPrompt((_) => {
    def("FILE", env.files) // oops, _. is missing and def added content in the main prompt
    $`Summarize files.` // oops, _ is missing and $ added content in the main prompt
})
```

* **bien**

```js "_.def"
const { text } = await runPrompt((_) => {
    _.def("FILE", env.files) // yes, def added content in the inner prompt
    _.$`Summarize the FILE.`
})
```

## Options

Les fonctions `prompt` et `runPrompt` prennent en charge diverses options similaires à la fonction `script`.

```js
const { text } = await prompt`Write a short poem.`.options({ temperature: 1.5 })
const { text } = await runPrompt((_) => { ...}, { temperature: 1.5 })
```

## Outils

Vous pouvez utiliser des invites internes dans les [outils](../../../reference/reference/scripts/tools/).

```js
defTool(
    "poet",
    "Writes 4 line poem about a given theme",
    {
        theme: {
            type: "string",
            description: "Theme of the poem",
        }
    },
    (({theme})) => prompt`Write a ${4} line ${"poem"} about ${theme}`
)
```

## Concurrence

Les fonctions `prompt` et `runPrompt` sont des fonctions asynchrones qui peuvent être utilisées dans une boucle pour exécuter plusieurs invites simultanément.

```js
await Promise.all(env.files, (file) => prompt`Summarize the ${file}`)
```

En interne, GenAIScript applique une limite de concurrence par modèle de 8 par défaut. Vous pouvez modifier cette limite en utilisant l'option `modelConcurrency`.

```js "modelConcurrency"
script({
    ...,
    modelConcurrency: {
        "openai:gpt-4o": 20
    }
})
```

Si vous avez besoin de plus de contrôle sur les files d'attente concurrentes,
vous pouvez essayer [p-all](https://www.npmjs.com/package/p-all),
[p-limit](https://www.npmjs.com/package/p-limit) ou des bibliothèques similaires.

## Scripts uniquement en ligne

Si vos scripts appellent uniquement des invites intégrées et ne génèrent jamais l'invite principale, vous pouvez les configurer pour utiliser le fournisseur LLM `none`.
Cela empêchera GenAIScript d'essayer de résoudre les informations de connexion et générera une erreur si vous essayez de créer des invites dans l'exécution principale.

```js
script({
    model: "none",
})
```

## Exemple : Résumé des résumés de fichiers utilisant Phi-3

L'extrait ci-dessous utilise [Phi-3](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/)
via [Ollama](https://ollama.com/) pour résumer individuellement les fichiers avant de les ajouter à l'invite principale.

<Code code={summaryOfSummaryPhi3} wrap={true} lang="js" />
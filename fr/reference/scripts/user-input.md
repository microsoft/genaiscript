GenAIScript fournit diverses fonctions pour obtenir une entrée utilisateur lors de l'exécution d'un script.
Ceci est utile pour créer une expérience "humain dans la boucle"
dans vos scripts.

Lors de l'exécution de [CLI](../../../reference/reference/cli/),
l'entrée utilisateur se fait via le terminal.

## `host.confirm`

Pose une question à l’utilisateur et attend une réponse oui/non. Elle retourne un `boolean`.

```js
// true/false
const ok = await host.confirm("Do you want to continue?")
```

## `host.input`

Pose une question à l’utilisateur et attend une saisie de texte. Elle retourne une `string`.

```js
const name = await host.input("What is your name?")
```

## `host.select`

Pose une question à l’utilisateur et attend une sélection dans une liste d’options.
Elle retourne une `string`.

```js
const choice = await host.select("Choose an option:", [
    "Option 1",
    "Option 2",
    "Option 3",
])
```

## Intégration Continue

Les fonctions d’entrée utilisateur retournent `undefined`
lorsqu’elles sont exécutées dans des environnements CI.
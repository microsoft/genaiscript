Lorsque vous travaillez avec GenAI, votre programme sera probablement en veille, en attendant que les jetons soient renvoyés par le LLM.

## await et async

JavaScript offre un excellent support pour les API asynchrones non bloquantes grâce aux [fonctions async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function).

```js
// takes a while
async function workM() { ... }

// let other threads work while this function is running
await work()
```

Cette fonctionnalité est utilisée dans les [prompts en ligne](../../../reference/reference/scripts/inline-prompts/) pour attendre un résultat LLM ou exécuter plusieurs requêtes simultanément.

## Exécution sérielle vs concurrente

Dans cet exemple, nous exécutons chaque requête LLM de manière 'séquentielle' en utilisant `await` :

```js
const poem = await prompt`write a poem`
const essay = await prompt`write an essay`
```

Cependant, nous pouvons exécuter toutes les requêtes 'simultanément' pour gagner du temps :

```js
const [poem, essay] = await Promise.all(
    prompt`write a poem`,
    prompt`write an essay`
)
```

Cela fonctionne, mais cela peut devenir problématique si vous avez de nombreuses entrées, car vous générerez de nombreuses requêtes simultanément et atteindrez probablement certaines limites de débit.
Notez que GenAIScript limite automatiquement le nombre de requêtes simultanées à un seul modèle pour éviter ce scénario.

## File de promesses

La file de promesses offre un moyen d'exécuter des promesses simultanément avec une limite de concurrence garantie, en spécifiant combien peuvent fonctionner en même temps.
La différence avec `Promise.all` est que vous encapsulez chaque promesse dans une fonction.

```js
const queue = host.promiseQueue(3)
const res = await queue.all([
    () => prompt`write a poem`
    () => prompt`write an essay`
])
```

Utilisez la fonction `mapAll` pour itérer sur un tableau.

```js
const queue = host.promiseQueue(3)
const summaries = await queue.mapAll(
    env.files,
    (file) => prompt`Summarize ${file}`
)
```
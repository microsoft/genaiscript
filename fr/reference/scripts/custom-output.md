La fonction `defOutputProcessor` enregistre un rappel pour effectuer un traitement personnalisé de la sortie du LLM à la fin du processus de génération. Cette fonction permet de créer de nouveaux fichiers ou de modifier des fichiers existants.

:::caution
Cette fonctionnalité est expérimentale et peut évoluer à l'avenir.
:::

```js
// compute a filepath
const output = path.join(path.dirname(env.spec), "output.txt")
// post processing
defOutputProcessor(output => {
    return {
        files: [
            // emit entire content to a specific file
            [output]: output.text
        ]
    }
})
```

## Nettoyage des fichiers générés

Cet exemple vide l'objet `fileEdits`, qui contient les mises à jour de fichiers analysées.

```js
defOutputProcessor((output) => {
    // clear out any parsed content
    for (const k of Object.keys(output.fileEdits)) {
        delete output.fileEdits[k]
    }
})
```
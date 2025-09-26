La fonction `defFileMerge` vous permet d'enregistrer une fonction de rappel personnalisée pour remplacer le comportement de fusion de fichiers par défaut.
Ceci peut être utile pour fusionner des fichiers d'une façon différente de la valeur par défaut, par exemple, pour fusionner des fichiers dans un autre format.

La fonction est appelée pour tous les fichiers ; retournez le contenu fusionné ou `undefined` pour ignorer le fichier.

```js
defFileMerge((filename, label, before, generated) => {
    // ...
})
```

Vous pouvez définir plusieurs fonctions de rappel de fusion de fichiers, elles seront exécutées dans l'ordre d'enregistrement.

## Exemple : ajout de contenu

La fonction de rappel ci-dessous ajoute le contenu dans les fichiers `.txt` générés.

```js
// append generated content
defFileMerge((filename, label, before, generated) => {
    // only merge .txt files
    if (!/\.txt$/i.test(filename)) return undefined
    // if content already existing, append generated content
    if (before) return `${before}\n${generated}`
    // otherwise return generated content
    return generated
})
```
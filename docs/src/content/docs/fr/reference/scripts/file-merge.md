---
title: Fusion de fichiers
description: Personnalisez la fusion de fichiers dans les scripts avec la
  fonction defFileMerge afin de gérer différents formats de fichiers et
  stratégies de fusion.
keywords: file merging, custom merge, defFileMerge, script customization,
  content appending
sidebar:
  order: 11
hero:
  image:
    alt: An 8-bit style icon shows a computer file with a folded corner, split into
      blue on one side and green on the other, representing "before" and
      "generated" document icons. An orange arrow connects both halves into one
      merged file with a bold plus sign at the center. The design uses five flat
      colors, simple geometric shapes, and no background.
    file: ../../../reference/scripts/file-merge.png

---

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

---
title: Sortie personnalisée
description: Découvrez comment utiliser la fonction defOutputProcessor pour un
  traitement de fichiers personnalisé lors de la génération de scripts.
keywords: custom output, defOutputProcessor, file processing, script generation,
  post processing
sidebar:
  order: 12
hero:
  image:
    alt: A minimalistic 8-bit style image depicts a stylized computer file with a
      glowing gear symbol and an arrow, suggesting file processing or
      modification. Nearby, a trash can has small colored documents hovering
      above it, representing files being cleaned or deleted. The image uses five
      flat colors, geometric forms, and has no background, text, people,
      shadows, or gradients, maintaining a clean, corporate-friendly look in a
      128x128 pixel format.
    file: ../../../reference/scripts/custom-output.png

---

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

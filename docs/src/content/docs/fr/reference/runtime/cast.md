---
title: Cast
description: Utilisez l'assistant cast pour convertir du texte en données structurées
sidebar:
  order: 80
hero:
  image:
    alt: A flat, minimalist 8-bit illustration at a size of 128x128 pixels displays
      a geometric file folder containing structured data sheets, each shown as
      rectangles with horizontal lines. These sheets emerge from a vivid,
      abstract text block and a simple image icon. Surrounding the folder are
      clean, minimal circuit or chip symbols indicating AI, along with lines or
      shapes representing data connections. The entire image is created using
      just five distinct corporate colors and lacks any background, shadows, or
      gradients.
    file: ../../../reference/runtime/cast.png

---

La fonction `cast` dans GenAIScript permet de convertir du texte ou des images en données structurées.
Elle offre une interface simple pour exploiter la puissance des LLM afin d'extraire des données à partir de textes et d'images non structurés.

## Utilisation

`cast` est défini dans le [runtime GenAIScript](/genaiscript/reference/runtime) et doit être importé. Il prend le texte non structuré (ou les fichiers), un schéma JSON
et retourne les données extraites (ou une erreur).

```js
import { cast } from "@genaiscript/runtime"

const { data } = await cast(
    "The quick brown fox jumps over the lazy dog.; jumps",
    {
        type: "object",
        properties: {
            partOfSpeech: { type: "string" },
        },
    },
    {
        instructions: `You will be presented with a sentence and a word contained
in that sentence. You have to determine the part of speech for a given word`,
    }
)
```

:::note
`cast` est fourni en tant que partie du runtime (une façon légèrement différente d'emballer les fonctionnalités de GenAIScript) et doit être importé en utilisant ce code...

```js
import { cast } from "@genaiscript/runtime"
```
:::

### Images

Vous pouvez passer une fonction qui prend un contexte d'invite
et construire la variable `DATA` de manière programmatique.
Cela vous permet de sélectionner des fichiers, des images et d'autres options GenAIScript.

```js
const res = await cast(_ => {
    _.defImages('DATA', img)
}, ...)
```

## Modèle et autres options

La fonction `cast` utilise par défaut l'[alias de modèle](/genaiscript/reference/scripts/model-aliases) `cast`.
Vous pouvez modifier cet alias ou spécifier un autre modèle dans les options.

```js
const res = await cast("...", {
    model: "large",
})
```

Les `options` sont transmises en interne à l’[invite en ligne](/genaiscript/reference/scripts/inline-prompts) et peuvent être utilisées pour modifier le comportement du LLM.

## Remerciements

Cette fonction est inspirée de [Marvin](https://www.askmarvin.ai/docs/text/transformation/).

<hr />

Traduit par IA. Veuillez vérifier le contenu pour plus de précision.

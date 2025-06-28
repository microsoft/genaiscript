---
title: Classify
description: Utilisez les assistants de classification pour vos tâches de classification
sidebar:
  order: 80
hero:
  image:
    alt: Three simple, brightly colored geometric boxes, each labeled with either
      "bug," "feature," or "qa," arranged in a corporate flat 8-bit art style.
      Above the boxes, abstract interconnected lines suggest AI or neural
      network analysis and a small digital bar shows classification probability.
      One box stands out as highlighted, indicating it has been selected. The
      image is small, uses only five bold colors, minimal shapes, and has no
      background, shadows, or people.
    file: ../../../reference/runtime/classify.png

---

La fonction `classify` dans GenAIScript vous permet de catégoriser des entrées basées sur un modèle d'apprentissage automatique.
Elle fournit une interface simple pour exploiter la puissance des LLM pour les tâches de classification.

## Utilisation

`classify` est défini dans le [runtime GenAIScript](/genaiscript/reference/runtime) et doit être importé. Il prend le texte à classer, un ensemble d'étiquettes (et des options pour le LLM)
et renvoie l'étiquette fournie par le LLM.

```js
import { classify } from "@genaiscript/runtime"

const { label } = await classify(
    "The app crashes when I try to upload a file.",
    {
        bug: "a software defect",
        feat: "a feature request",
        qa: "an inquiry about how to use the software",
    }
)
```

* L'invite encourage le LLM à expliquer ses choix **avant** de retourner l'étiquette.
* Les jetons d'étiquette sont boostés à l'aide du logit-bias pour améliorer la fiabilité de la classification.

:::note
`classify` est fourni dans le runtime (une façon légèrement différente de packager les fonctionnalités de GenAIScript) et doit être importé avec ce code...

```js
import { classify } from "@genaiscript/runtime"
```
:::

### Images

Vous pouvez passer une fonction qui prend un contexte d'invite
et construire la variable `DATA` de manière programmatique.
Cela vous permet de sélectionner des fichiers, images et autres options GenAIScript.

```js
const res = await classify(_ => {
    _.defImages('DATA', img)
}, ...)
```

## Étiquettes

Le paramètre `labels` est un objet où les clés sont les étiquettes dans lesquelles vous souhaitez classer l'entrée, et les valeurs sont des descriptions de ces étiquettes. Le LLM utilise ces descriptions pour comprendre ce que chaque étiquette signifie.

Chaque identifiant d'étiquette doit être un mot unique qui s'encode en un seul jeton. Cela permet de booster l'étiquette avec logit-bias et d'améliorer la fiabilité de la classification.

### Étiquette `other`

Une étiquette `other` peut être automatiquement ajoutée à la liste
des étiquettes pour offrir une échappatoire au LLM quand il n'est pas capable de classer le texte.

```js "other: true"
const res = await classify(
    "...",
    { ... },
    { other: true }
)
```

## Explications

Par défaut, l'invite de classification est réglée pour retourner un jeton (`maxToken: 1`) comme étiquette.
Vous pouvez activer l'émission d'une justification avant de retourner l'étiquette.

```js "explanation: true"
const res = await classify(
    "...",
    { ... },
    { explanation: true }
)
```

## Modèle et autres options

La fonction `classify` utilise par défaut l'[alias modèle `classify`](/genaiscript/reference/scripts/model-aliases).
Vous pouvez modifier cet alias ou spécifier un autre modèle dans les options.

```js
const res = await classify("...", {
    model: "large",
})
```

Les `options` sont passées en interne à l'[invite inline](/genaiscript/reference/scripts/inline-prompts) et peuvent être utilisées pour modifier le comportement du LLM.

## Évaluation de la qualité de classification

GenAIScript renvoie la [logprob](/genaiscript/reference/scripts/logprobs) (et l'entropie) de l'étiquette de classification. Vous pouvez utiliser cette valeur pour évaluer la qualité de l'étiquetage.

Si l'étiquette a une forte probabilité, cela signifie que la classification est probablement de bonne qualité. Une probabilité plus faible peut indiquer que le LLM a hésité ou que d'autres étiquettes ont également été prises en compte.

```js
const { label, probPercent } = await classify(...)
if (probPercent < 80) { // 80%
    console.log(`classifier confused...`)
}
```

### Configuration

Vous pouvez désactiver les `logprobs` en réglant `logprobs: false` dans les options. Vous pouvez désactiver `topLogprobs` en réglant `topLogprobs: false` dans les options.

## Remerciements

Cette fonction est inspirée de la classification dans [Marvin](https://www.askmarvin.ai/docs/text/classification/).

<hr />

Traduit à l'aide de l'IA. Veuillez vérifier le contenu pour en assurer l'exactitude.

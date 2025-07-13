---
title: Choix
description: Spécifiez une liste de choix de jetons préférés pour un script.
keywords: choices, preferred words, logit bias
sidebar:
  order: 20
hero:
  image:
    alt: 'An image in 8-bit minimalist style shows two flat-colored square tokens:
      one with a checkmark symbolizing "OK", and one with an "X" for "ERR". The
      squares are joined by lines indicating adjustment or transition between
      states. The design uses five distinct colors, features bold, basic shapes,
      and has no text, people, or background details.'
    file: ../../../reference/scripts/choices.png

---

Vous pouvez spécifier une liste de mots préférés (choix) dans les métadonnées du script. Cela augmentera la probabilité que le modèle génère les mots spécifiés.

* Chaque mot doit correspondre à un seul jeton pour le modèle souhaité !
* Pour certains modèles, GenAIScript n'a pas de codeur de jetons et ne pourra donc pas calculer le biais logit pour les choix.

```js
script({
    choices: ["OK", "ERR"],
})
...
```

```text
ERR
```

## Poids personnalisés

Vous pouvez ajuster la probabilité de chaque choix en fournissant un poids pour chaque choix.
Le poids par défaut est `5`.

```js '{ token: "ERR", weight: 10 }'
script({
    choices: ["OK", { token: "ERR", weight: 10 }],
})
```

## Jetons pré-encodés

Pour les modèles où GenAIScript n'a pas de codeur de jetons, vous pouvez fournir les jetons pré-encodés.

```js
script({
    choices: [{ token: 12345, weight: 10 }],
})
```

## Biais Logit

En interne, GenAIScript tokenize le mot et construit le [logit\_bias](https://help.openai.com/en/articles/5247780-using-logit-bias-to-alter-token-probability-with-the-openai-api) pour chaque jeton.

* choix : `OK`, `ERR`
* biais logit : `{"5175":5,"5392":5}`

## Logprobs

Vous pouvez activer [logprobs](../../../reference/reference/scripts/logprobs/) pour visualiser la confiance des jetons générés par le modèle.

***

<span class="logprobs" title="100% (-0.000003)" style="background: rgb(0, 0, 180); color: white; white-space: pre; font-family: monospace;">ERR</span>
<span class="logprobs" title="32.07% (-1.14)" style="background: rgb(122, 0, 58); color: white; white-space: pre; font-family: monospace;">.</span>

***

---
title: Tokeniseurs
description: Les tokeniseurs sont utilisés pour diviser le texte en tokens.
sidebar:
  order: 60
hero:
  image:
    alt: An 8-bit style illustration of a geometric speech bubble made up of
      distinct, colored blocks to represent separate text tokens; some small
      colored rectangles detach from the main shape, symbolizing text chunking;
      a basic slider icon illustrates truncation. The image is minimalistic,
      flat, in five colors, sized 128x128 pixels, with no background or human
      figures.
    file: ../../../reference/scripts/tokenizers.png

---

Le module d'aide `tokenizers` fournit un ensemble de fonctions pour diviser le texte en tokens.

```ts
const n = tokenizers.count("hello world")
```

## Choisir votre tokeniseur

Par défaut, le module `tokenizers` utilise le tokeniseur `large`. Vous pouvez changer de tokeniseur en passant l'identifiant du modèle.

```ts 'model: "gpt-4o-mini"'
const n = await tokenizers.count("hello world", { model: "gpt-4o-mini" })
```

## `count`

Compte le nombre de tokens dans une chaîne de caractères.

```ts wrap
const n = await tokenizers.count("hello world")
```

## `truncate`

Supprime une partie de la chaîne pour respecter un budget de tokens

```ts wrap
const truncated = await tokenizers.truncate("hello world", 5)
```

## `chunk`

Divise le texte en segments d'une taille de tokens donnée. Le segment essaie de trouver des frontières de découpage appropriées en fonction du type de document.

```ts
const chunks = await tokenizers.chunk(env.files[0])
for(const chunk of chunks) {
    ...
}
```

Vous pouvez configurer la taille des segments, le chevauchement et ajouter des numéros de ligne.

```ts wrap
const chunks = await tokenizers.chunk(env.files[0], {
    chunkSize: 128,
    chunkOverlap 10,
    lineNumbers: true
})
```

<hr />

Traduit par IA. Veuillez vérifier le contenu pour plus de précision.

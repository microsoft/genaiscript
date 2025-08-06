---
title: INI
description: Apprenez à analyser et à formater les fichiers INI dans GenAIScript
  avec la classe INI, y compris les méthodes et des exemples d'utilisation.
sidebar:
  order: 17.1
keywords: INI parsing, INI stringifying, INI file format, .ini manipulation,
  configuration files
hero:
  image:
    alt: "An 8-bit style icon depicts a white sheet of paper split into two parts:
      the left features horizontal colored stripes resembling lines in a .ini
      file, while the right displays a basic code bracket symbol. A geometric
      gear and a checkmark appear at one corner, implying settings parsing and
      successful validation. The design is minimal, flat, uses five corporate
      colors, and has no background. Icon size is 128x128 pixels."
    file: ../../../reference/scripts/ini.png

---

Analyse et formatage des données `.ini`.

## `INI`

De manière similaire à la classe `JSON` en JavaScript, la classe `INI` fournit des méthodes pour analyser et formater les [fichiers `.ini`](https://en.wikipedia.org/wiki/INI_file).

```js
const fields = INI.parse(`...`)
const txt = INI.string(obj)
```

## `parsers`

Les [parsers](../../../reference/reference/scripts/parsers/) fournissent également un analyseur tolérant pour les fichiers `.env`. Retourne `undefined` pour les entrées non valides.

```js
const fields = parsers.INI(env.files[0])
```

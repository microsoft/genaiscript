---
title: YAML
description: Apprenez comment utiliser YAML pour la sérialisation de données, la
  configuration et l'analyse dans LLM avec defData, la classe YAML, et la
  validation des schémas JSON.
sidebar:
  order: 16
keywords: YAML serialization, configuration files, data parsing, YAML stringify,
  YAML parse
hero:
  image:
    alt: "Two abstract, 8-bit style icons represent data files: the first has three
      horizontal lines, indicating YAML format; the second shows curly brackets
      and an arrow, symbolizing a coding function. A minimalist gear stands for
      parsing or validation, and simple lines connect the files, function, and
      gear to suggest the process flow. The design uses five distinct corporate
      colors, stays flat, minimal, and abstract, and is set at a compact 128x128
      size with no background."
    file: ../../../reference/scripts/yaml.png

---

[YAML](https://yaml.org/) est un format de sérialisation de données lisible par l'homme, couramment utilisé pour les fichiers de configuration et l'échange de données.

Dans le contexte de LLM, YAML est plus convivial pour l'algorithme du tokenizer et est généralement préféré à JSON pour représenter des données structurées.

## `defData`

La fonction `defData` convertit un objet en YAML dans l'invite (et d'autres formats si nécessaire).

```js
defData("DATA", data)
```

## `YAML`

De la même manière que la classe `JSON` en JavaScript, la classe `YAML` dans LLM fournit des méthodes pour analyser et convertir en chaîne des données YAML.

```js
const obj = YAML`value: ${x}`
const obj = YAML.parse(`...`)
const str = YAML.stringify(obj)
```

## `parsers`

Les [parsers](../../../reference/reference/scripts/parsers/) fournissent également un analyseur tolérant pour YAML.
Il renvoie `undefined` pour les entrées invalides.

```js
const res = parsers.YAML("...")
```

## Schémas

Les schémas JSON définis avec [defSchema](../../../reference/reference/scripts/schemas/) peuvent également être utilisés pour valider les données YAML.

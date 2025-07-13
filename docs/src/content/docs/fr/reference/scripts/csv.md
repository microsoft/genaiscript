---
title: CSV
description: Apprenez à analyser et à générer des données CSV à l'aide de la
  classe CSV dans les scripts.
keywords: CSV parsing, CSV stringifying, CSV data, CSV manipulation, CSV utility
sidebar:
  order: 17
genaiscript:
  files: src/samples/penguins.csv
hero:
  image:
    alt: A simplified 8-bit style illustration shows a CSV file icon with a
      checkmark, a grid pattern representing spreadsheet rows and columns, and a
      small gear to indicate data parsing tools. The design uses only five solid
      colors, has no human figures, text, shadows, gradients, or background, and
      appears completely flat and two-dimensional.
    file: ../../../reference/scripts/csv.png

---

Analyse et génération (stringify) de données au format CSV (Comma Separated Values).

Les analyseurs (parsers) convertissent les données CSV en un tableau d'objets, dont les noms de champs correspondent à l'entête. Par exemple, les données CSV suivantes :

```csv
name, value
A, 10
B, 2
C, 3
```

sont converties en le tableau d'objets suivant :

```json
[
    {
        "name": "A",
        "value": 10
    },
    {
        "name": "B",
        "value": 2
    },
    {
        "name": "C",
        "value": 3
    }
]
```

## `def`

La fonction [def](../../../reference/reference/scripts/context/) analyse et génère automatiquement les données CSV en une table Markdown (fonctionne aussi pour [XLSX](../../../reference/reference/scripts/xlsx/)).

```js assistant=false
def("DATA", env.files[0])
```

`def` prend également en charge des options de filtrage basiques pour contrôler le nombre de lignes à insérer dans l'invite.

```js assistant=false
def("DATA", env.files[0], {
    sliceHead: 50, // take first 50
    sliceTail: 25, // take last 25
    sliceSample: 5, // take 5 at random
})
```

## `CSV`

De la même manière que la classe `JSON` en JavaScript, la classe `CSV` fournit des méthodes pour analyser et générer des données au format CSV (Comma-Separated Values).

### `parse`

La méthode `parse` convertit une chaîne CSV en un tableau d'objets. La première ligne est utilisée comme ligne d'entête.

```js "CSV.parse"
const csv = await workspace.readText("penguins.csv")
const rows = CSV.parse(csv)
```

Si le fichier CSV ne possède pas de ligne d'entête, vous pouvez spécifier les noms des colonnes sous forme de tableau de chaînes de caractères. Vous pouvez aussi définir un séparateur de données personnalisé.

```js
const rows = CSV.parse(csv, {
    delimiter: "|",
    headers: ["name", "value"],
})
```

Vous pouvez utiliser [defData](../../../reference/reference/scripts/context/) pour sérialiser l'objet `rows` dans l'invite. `defData` prend en charge les mêmes options de filtrage basiques que `def`.

```js
defData("DATA", rows)
```

:::note
La fonction `def` fonctionne avec des fichiers, tandis que `defData` fonctionne avec des objets en mémoire.
:::

### `stringify`

La méthode `stringify` convertit un tableau d'objets en chaîne CSV.

```js "CSV.stringify"
const csvString = CSV.stringify(rows)
```

La méthode `markdownify` convertit un tableau d'objets en table Markdown. Ce format est plus efficace pour les tokenizers des LLM.

```js "CSV.markdownify"
const md = CSV.markdownify(rows)
```

```text
| name | value |
|------|-------|
| A    | 10    |
| B    | 2     |
| C    | 3     |
```

## `parsers`

Les [parsers](../../../reference/reference/scripts/parsers/) proposent également un analyseur dédié au CSV. Il renvoie `undefined` pour les entrées invalides et prend en charge les fichiers ainsi que les options de parsing.

```js
const rows = parsers.CSV(env.files[0])
```

## Réparation

Vous pouvez spécifier l’option `repair: true` pour corriger les erreurs courantes des LLM lors du traitement du CSV.

```js
const rows = CSV.parse(csv, { repair: true })
```

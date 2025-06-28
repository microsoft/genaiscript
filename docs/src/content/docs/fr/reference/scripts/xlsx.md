---
title: XLSX
description: Apprenez à analyser et à convertir en chaîne les fichiers Excel
  XLSX facilement grâce à nos outils.
keywords: XLSX parsing, Excel file handling, spreadsheet manipulation, XLSX
  stringify, Excel data processing
sidebar:
  order: 17.5
hero:
  image:
    alt: A simple 2D 8-bit style icon depicts a geometric spreadsheet with visible
      grid cells and bold, blocky tabs. Over the spreadsheet is a thickly
      outlined gear symbol, representing a parser. The design uses five distinct
      corporate colors, features only flat, basic shapes, and is shown without
      people or text, against a transparent background. The image is small and
      square, 128 by 128 pixels, with no shadows or gradients.
    file: ../../../reference/scripts/xlsx.png

---

Analyse et conversion en chaîne des fichiers de tableur Excel, xlsx.

## `parsers`

Les [parsers](/genaiscript/reference/scripts/parsers) fournissent également un analyseur polyvalent pour XLSX. Il renvoie un tableau de feuilles (`name`, `rows`) où chaque ligne est un tableau d'objets.

```js
const sheets = await parsers.XLSX(env.files[0])
```

<hr />

Traduit par IA. Veuillez vérifier le contenu pour plus de précision.

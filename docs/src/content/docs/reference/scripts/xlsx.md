---
title: XLSX
description: Learn how to parse and stringify Excel XLSX files with ease using our tools.
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
    file: ./xlsx.png

---

Parsing and stringifying of Excel spreadsheet files, xlsx.

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provide a versatile parser for XLSX. It returns an array of sheets (`name`, `rows`)
where each row is an array of objects.

```js
const sheets = await parsers.XLSX(env.files[0])
```

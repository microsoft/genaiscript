---
title: XLSX
sidebar:
    order: 17.5
---

Parsing and stringifying of Excel spreadsheet files, xlsx.

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provides merciful parser for XLSX. It returns an array of sheets (`name`, `rows`)
where row is an array of objects.

```js
const sheets = await parsers.XLSX(env.files[0])
```

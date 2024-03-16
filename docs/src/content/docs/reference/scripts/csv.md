---
title: CSV
sidebar:
    order: 17
---

Parsing and stringifying of CSV data.

## `CSV`

Similarly to the `JSON` class in JavaScript, the `CSV` class provides methods to parse and stringify comma separated values (csv) data.

```js
const rows = CSV.parse(`...`)
const md = CSV.markdownify(obj)
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provides merciful parser for CSV.
Returns `undefined` for invalid inputs.

```js
const rows = parsers.CSV(env.files[0])
```

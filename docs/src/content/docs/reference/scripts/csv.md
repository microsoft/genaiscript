---
title: CSV
sidebar:
    order: 17
---

Convinience parses for CSV data.

## `CSV`

Similarly to the `JSON` class in JavaScript, the `CSV` class in LLM provides methods to parse and stringify YAML data.

```js
const rows = CSV.parse(`...`)
const md = CSV.markdownify(obj)
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provides merciful parser for CSV.
Returns `undefined` for invalid inputs.

```js
const rows = parsers.CSV("...")
```

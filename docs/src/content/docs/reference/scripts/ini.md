---
title: INI
description: Learn how to parse and stringify INI files in GenAIScript with the INI class, including methods and usage examples.
sidebar:
    order: 17.1
keywords: INI parsing, INI stringifying, INI file format, .ini manipulation, configuration files
---

Parsing and stringifying of `.ini` data.

## `INI`

Similarly to the `JSON` class in JavaScript, the `INI` class provides methods to parse and stringify [`.ini` files](https://en.wikipedia.org/wiki/INI_file).

```js
const fields = INI.parse(`...`)
const txt = INI.string(obj)
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provide a merciful parser for `.env`.
Returns `undefined` for invalid inputs.

```js
const fields = parsers.INI(env.files[0])
```

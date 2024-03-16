---
title: .env
sidebar:
    order: 17.1
---

Parsing and stringifying of `.env` data.

## `DotEnv`

Similarly to the `JSON` class in JavaScript, the `DotEnv` class provides methods to parse and stringify `.env` data.

```js
const fields = DotEnv.parse(`...`)
const txt = DotEnv.string(obj)
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provides merciful parser for `.env`.
Returns `undefined` for invalid inputs.

```js
const fields = parsers.DotEnv(env.files[0])
```

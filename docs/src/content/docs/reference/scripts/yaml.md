---
title: YAML
sidebar:
    order: 16
---

[YAML](https://yaml.org/) is a human-readable data serialization format that is commonly used for configuration files and data exchange.

In the context of LLM, YAML is friendlier to the tokenizer algorithm and can generally be preferred to JSON to represent structured data.

## `YAML`

Similarly to the `JSON` class in JavaScript, the `YAML` class in LLM provides methods to parse and stringify YAML data.

```js
const obj = YAML.parse(`...`)
const str = YAML.stringify(obj)
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provides merciful parser for YAML.

```js
const res = parsers.YAML("...")
```

## Schemas

JSON schemas defined with [defSchema](/reference/scripts/structured-data) can also be used to validate YAML data.

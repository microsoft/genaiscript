---
title: YAML
description: Learn how to use YAML for data serialization, configuration, and
  parsing in LLM with defData, YAML class, and JSON schema validation.
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
    file: ./yaml.png
llmstxt:
  content: >-
    YAML is a human-readable data serialization format often used for
    configuration files and data exchange. It is preferred over JSON in LLM
    contexts due to its tokenizer-friendly structure.


    The `defData` function renders objects to YAML or other formats as needed:
    `defData("DATA", data)`.


    The `YAML` class in LLM provides methods for parsing and stringifying YAML
    data:

    `const obj = YAML\`value: ${x}\``

    `const obj = YAML.parse("...")`

    `const str = YAML.stringify(obj)`


    The `parsers.YAML` method is a lenient YAML parser that returns `undefined`
    for invalid inputs: `const res = parsers.YAML("...")`.


    JSON schemas defined with `defSchema` can validate YAML data.
  hash: a0e4e413e4a9a90289313a87f35283cd06758f32c3c8b0e9cd4e46d8fd0f0ab5

---

[YAML](https://yaml.org/) is a human-readable data serialization format that is commonly used for configuration files and data exchange.

In the context of LLM, YAML is friendlier to the tokenizer algorithm and is generally preferred over JSON to represent structured data.

## `defData`

The `defData` function renders an object to YAML in the prompt (and other formats if needed).

```js
defData("DATA", data)
```

## `YAML`

Similarly to the `JSON` class in JavaScript, the `YAML` class in LLM provides methods to parse and stringify YAML data.

```js
const obj = YAML`value: ${x}`
const obj = YAML.parse(`...`)
const str = YAML.stringify(obj)
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provide a lenient parser for YAML.
It returns `undefined` for invalid inputs.

```js
const res = parsers.YAML("...")
```

## Schemas

JSON schemas defined with [defSchema](/genaiscript/reference/scripts/schemas) can also be used to validate YAML data.

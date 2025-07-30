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
    YAML is a human-readable data format used for configuration and data
    exchange. It is preferred over JSON in LLMs due to better tokenizer
    compatibility.


    The `defData` function renders objects to YAML or other formats:  

    `defData("DATA", data)`


    The `YAML` class provides methods for parsing and stringifying YAML:  

    `const obj = YAML.parse("...")`  

    `const str = YAML.stringify(obj)`


    Lenient YAML parsing is available via `parsers.YAML`, which returns
    `undefined` for invalid inputs:  

    `const res = parsers.YAML("...")`


    JSON schemas defined with `defSchema` can validate YAML data.
  hash: 2964671b3530aefa39195ea8f32e5d76c91736721b2314b2b5a2d3adb55a7bff

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

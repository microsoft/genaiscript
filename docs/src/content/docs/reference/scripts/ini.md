---
title: INI
description: Learn how to parse and stringify INI files in GenAIScript with the
  INI class, including methods and usage examples.
sidebar:
  order: 17.1
keywords: INI parsing, INI stringifying, INI file format, .ini manipulation,
  configuration files
hero:
  image:
    alt: "An 8-bit style icon depicts a white sheet of paper split into two parts:
      the left features horizontal colored stripes resembling lines in a .ini
      file, while the right displays a basic code bracket symbol. A geometric
      gear and a checkmark appear at one corner, implying settings parsing and
      successful validation. The design is minimal, flat, uses five corporate
      colors, and has no background. Icon size is 128x128 pixels."
    file: ./ini.png

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

---
title: CSV
description: Learn how to parse and stringify CSV data using the CSV class in scripting.
keywords: CSV parsing, CSV stringifying, CSV data, CSV manipulation, CSV utility
sidebar:
  order: 17
genaiscript:
  files: src/samples/penguins.csv
hero:
  image:
    alt: A simplified 8-bit style illustration shows a CSV file icon with a
      checkmark, a grid pattern representing spreadsheet rows and columns, and a
      small gear to indicate data parsing tools. The design uses only five solid
      colors, has no human figures, text, shadows, gradients, or background, and
      appears completely flat and two-dimensional.
    file: ./csv.png
llmstxt:
  content: >-
    Parsing and stringifying CSV data involves converting between CSV strings
    and arrays of objects. The first row of CSV is treated as the header,
    mapping fields to object keys.


    Example:

    CSV:

    name, value  

    A, 10  

    B, 2  

    C, 3  


    Maps to:

    [
      { "name": "A", "value": 10 },
      { "name": "B", "value": 2 },
      { "name": "C", "value": 3 }
    ]


    The `def` function parses CSV/XLSX files and converts them to Markdown
    tables. It supports row filtering:

    def("DATA", env.files[0], { sliceHead: 50, sliceTail: 25, sliceSample: 5 })


    The `CSV` class provides `parse` and `stringify` methods. `parse` converts
    CSV strings to arrays of objects. Options include custom delimiters and
    headers:

    CSV.parse(csv, { delimiter: "|", headers: ["name", "value"] })


    `stringify` converts arrays of objects to CSV strings. `markdownify`
    converts them to Markdown tables:

    CSV.markdownify(rows)


    | name | value |  

    |------|-------|  

    | A    | 10    |  

    | B    | 2     |  

    | C    | 3     |  


    `parsers.CSV` parses files and supports repair options for fixing common CSV
    issues:

    CSV.parse(csv, { repair: true })
  hash: c8f55e354d2c1ad375b477dbf735d97c894d64552018a0123a4abd19ad390e4f

---

Parsing and stringifying of Comma Separated Values (CSV) data.

The parsers map CSV data to an array of objects, with field names corresponding to the header. For example, the CSV data:

```csv
name, value
A, 10
B, 2
C, 3
```

maps to the following array of objects:

```json
[
    {
        "name": "A",
        "value": 10
    },
    {
        "name": "B",
        "value": 2
    },
    {
        "name": "C",
        "value": 3
    }
]
```

## `def`

The [def](/genaiscript/reference/scripts/context) function automatically parses and stringifies CSV data to a Markdown table (it also works for [XLSX](/genaiscript/reference/scripts/xlsx)).

```js assistant=false
def("DATA", env.files[0])
```

`def` also supports basic row filtering options that control how many rows you want to insert into the prompt.

```js assistant=false
def("DATA", env.files[0], {
    sliceHead: 50, // take first 50
    sliceTail: 25, // take last 25
    sliceSample: 5, // take 5 at random
})
```

## `CSV`

Similarly to the `JSON` class in JavaScript, the `CSV` class provides methods to parse and stringify comma-separated values (CSV) data.

### `parse`

The `parse` method converts a CSV string into an array of objects. The first row is used as the header row.

```js "CSV.parse"
const csv = await workspace.readText("penguins.csv")
const rows = CSV.parse(csv)
```

If the CSV file does not have a header row, you can specify the column names as an array of strings. You can also specify a custom data separator.

```js
const rows = CSV.parse(csv, {
    delimiter: "|",
    headers: ["name", "value"],
})
```

You can use [defData](/genaiscript/reference/scripts/context) to serialize the `rows` object to the prompt. `defData` also supports basic row filtering options like `def`.

```js
defData("DATA", rows)
```

:::note

The `def` function works with files, while `defData` works with live objects.

:::

### `stringify`

The `stringify` method converts an array of objects to a CSV string.

```js "CSV.stringify"
const csvString = CSV.stringify(rows)
```

The `markdownify` method converts an array of objects into a Markdown table. This encoding is more efficient with LLM tokenizers.

```js "CSV.markdownify"
const md = CSV.markdownify(rows)
```

```text
| name | value |
|------|-------|
| A    | 10    |
| B    | 2     |
| C    | 3     |
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provide a parser for CSV. It returns `undefined` for invalid inputs and supports files and parsing options.

```js
const rows = parsers.CSV(env.files[0])
```


## Repair

You can specify the `repair: true` option to fix common LLM mistakes around CSV.

```js
const rows = CSV.parse(csv, { repair: true })
```

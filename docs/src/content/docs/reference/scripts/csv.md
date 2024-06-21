---
title: CSV
description: Learn how to parse and stringify CSV data using the CSV class in scripting.
keywords: CSV parsing, CSV stringifying, CSV data, CSV manipulation, CSV utility
sidebar:
  order: 17
genaiscript:
  files: src/samples/penguins.csv

---

Parsing and stringifying of Comma Separated Values (CSV) data.

The parsers map CSV data to an array of object with field names mapping the header. For example, the CSV data:

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

The [def](/genaiscript/reference/scripts/context) function will automatically parse and stringify CSV data to a Markdown table (it also works for [XLSX](/genaiscript/reference/scripts/xlsx)).

```js assistant=false
def("DATA", env.files[0])
```

`def` also support basic row filtering options that easily control how many rows you want to insert in the prompt.

```js assistant=false
def("DATA", env.files[0], {
  sliceHead: 50, // take first 50
  sliceTail: 25, // take last 25
  sliceSample: 5 // take 5 at random
})
```

## `CSV`

Similarly to the `JSON` class in JavaScript, the `CSV` class provides methods to parse and stringify comma separated values (csv) data.

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
    headers: ["name", "value"]
})
```

You can use [defData](/genaiscript/reference/scripts/context)
to serialize the `rows` object to the prompt. `defData` also support
basic row filtering options like with `def`.

```js
defData("DATA", rows)
```

:::note

The `def` function works with files, while `defData` works with live objects.

:::

### `markdownify`

The `markdownify` method converts an array of objects into a markdown table. 
This is an encoding that is somewhat more efficient with LLM tokenizers.

```js "CSV.mardownify"
const md = CSV.mardownify(rows)
```

```text
| name | value |
|------|-------|
| A    | 10    |
| B    | 2     |
| C    | 3     |
```

## `parsers`

The [parsers](/genaiscript/reference/scripts/parsers) also provides merciful parser for CSV.
Returns `undefined` for invalid inputs. It also supports files and parsing options.

```js
const rows = parsers.CSV(env.files[0])
```

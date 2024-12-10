
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

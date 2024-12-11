
The `parsers` object provides various parsers for common data formats.

## JSON5

The `parsers.json5` function parses the JSON5 format.
[JSON5](https://json5.org/) is an extension to the popular JSON file format that aims to be easier to write and maintain by hand (e.g. for config files).

In general, parsing a JSON file as JSON5 does not cause harm, but it might be more forgiving
to syntactic errors. In addition to JSON5, [JSON repair](https://www.npmjs.com/package/jsonrepair) is applied if the initial parse fails.

-   JSON5 example

```json5
{
    // comments
    unquoted: "and you can quote me on that",
    singleQuotes: 'I can use "double quotes" here',
    lineBreaks: "Look, Mom! \
No \\n's!",
    hexadecimal: 0xdecaf,
    leadingDecimalPoint: 0.8675309,
    andTrailing: 8675309,
    positiveSign: +1,
    trailingComma: "in objects",
    andIn: ["arrays"],
    backwardsCompatible: "with JSON",
}
```

To parse, use `parsers.JSON5`. It supports both a text content or a file as input.

```js
const res = parsers.JSON5("...")
```

## YAML

The `parsers.YAML` function parses the [YAML format](/genaiscript/reference/scripts/yaml).
YAML is more friendly to the LLM tokenizer than JSON and is commonly used in configuration
files.

```yaml
fields:
    number: 1
    boolean: true
    string: foo
array:
    - 1
    - 2
```

To parse, use `parsers.YAML`. It supports both a text content or a file as input.

```js
const res = parsers.YAML("...")
```

## TOML

The `parsers.TOML` function parses the [TOML format](https://toml.io/).
TOML is more friendly to the LLM tokenizer than JSON and is commonly used in configuration
files.

```toml
# This is a TOML document
title = "TOML Example"
[object]
string = "foo"
number = 1
```

To parse, use `parsers.TOML`. It supports both a text content or a file as input.

```js
const res = parsers.TOML("...")
```

## JSONL

JSON**L** is a format that stores JSON objects in a line-by-line format. Each line is a valid JSON(5) object (we use the JSON5 parser to be more error resilient).

```jsonl title="data.jsonl"
{"name": "Alice"}
{"name": "Bob"}
```

You can use `parsers.JSONL` to parse the JSONL files into an array of object (`any[]`).

```js
const res = parsers.JSONL(file)
```

## [XML](./xml.md)

The `parsers.XML` function parses for the [XML format](https://en.wikipedia.org/wiki/XML).

```js
const res = parsers.XML('<xml attr="1"><child /></xml>')
```

Attribute names are prepended with "@\_".

```json
{
    "xml": {
        "@_attr": "1",
        "child": {}
    }
}
```

## front matter

[Front matter](https://jekyllrb.com/docs/front-matter/) is a metadata section at the head of a file, typically formatted as YAML.

```markdown
---
title: "Hello, World!"
---

...
```

You can use the `parsers.frontmatter` or [MD](./md.md) to parse out the metadata into an object

```js
const meta = parsers.frontmatter(file)
```

## [CSV](./csv.md)

The `parsers.CSV` function parses for the [CSV format](https://en.wikipedia.org/wiki/Comma-separated_values). If successful, the function returns an array of object where each object represents a row in the CSV file.

```js
const res = parsers.CSV("...")
```

The parsers will auto-detect the header names if present; otherwise you should
pass an array of header names in the options.

```js
const res = parsers.CSV("...", { delimiter: "\t", headers: ["name", "age"] })
```

## [PDF](./pdf.md)

The `parsers.PDF` function reads a PDF file and attempts to cleanly convert it into a text format. Read the [/genaiscript/reference/scripts/pdf](/genaiscript/reference/scripts/pdf) for more information.

## [DOCX](./docx.md)

The `parsers.DOCX` function reads a .docx file as raw text.

## [INI](./ini.md)

The `parsers.INI` parses [.ini](https://en.wikipedia.org/wiki/INI_file) files, typically
used for configuration files. This format is similar to the `key=value` format.

```txt
KEY=VALUE
```

## [XLSX](./xlsx.md)

The `parsers.XLSX` function reads a .xlsx file and returns an array of objects where each object represents a row in the spreadsheet.
The first row is used as headers.
The function uses the [xlsx](https://www.npmjs.com/package/xlsx) library.

```js
const sheets = await parsers.XLSX("...filename.xlsx")
const { rows } = sheets[0]
```

By default, it reads the first sheet and the first row as headers. You can pass a worksheet name
and/or a range to process as options.

```js
const res = await parsers.XLSX("...filename.xlsx", {
    sheet: "Sheet2",
    range: "A1:C10",
})
```

## Unzip

Unpacks the contents of a zip file and returns an array of files.

```js
const files = await parsers.unzip(env.files[0])
```

## HTML to Text

The `parsers.HTMLToText` converts HTML to plain text using [html-to-text](https://www.npmjs.com/package/html-to-text).

```js
const text = parsers.HTMLToText(html)
```

## Code (JavaScript, Python, C, C++, Java, ...)

The `parsers.code` function parses source code using the [Tree Sitter](https://tree-sitter.github.io/tree-sitter/)
library. It returns an AST (Abstract Syntax Tree) that can be used to analyze the code.

```js
// the whole tree
const { captures } = await parsers.code(file)
// with a query
const { captures } = await parsers.code(file, "(interface_declaration) @i")
```

The `tags` query is a built-in alias for the [tree-sitter `tags` query](https://tree-sitter.github.io/tree-sitter/code-navigation-systems) that is made available in most tree-sitter libraries.

````js
const { captures } = await parsers.code(file, 'tags')
```

## Math expression

The `parsers.math` function uses [mathjs](https://mathjs.org/) to parse a math expression.

```js
const res = await parsers.math("1 + 1")
````

## .env

The `parsers.dotEnv` parses [.env](https://www.dotenv.org/) files, typically
using for configuration files. This format is similar to the `key=value` format.

```txt
KEY=VALUE
```

## fences

Parse output of LLM similar to output of genaiscript def() function.
Expect text to look something like this:

````
Foo bar:
```js
var x = 1
...
```

Baz qux:
````

Also supported.
...

```

```

Returns a list of parsed code sections.

```js
const fences = parsers.fences("...")
```

## annotations

Parses error, warning annotations in various formats
into a list of objects.

-   [GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions)
-   [Azure DevOps Pipeline](https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash#example-log-a-warning-about-a-specific-place-in-a-file)
-

```js
const annotations = parsers.annotations("...")
```

## tokens

The `parsers.tokens` estimates the number of tokens in a string
for the current model. This is useful for estimating the number of prompts that can be generated from a string.

```js
const count = parsers.tokens("...")
```

## validateJSON

The `parsers.validateJSON` function validates a JSON string against a schema.

```js
const validation = parsers.validateJSON(schema, json)
```

## mustache

Runs the [mustache](https://mustache.github.io/) template engine in the string and arguments.

```js
const rendered = parsers.mustache("Today is {{date}}.", { date: new Date() })
```

## jinja

Runs the [jinja](https://jinja.palletsprojects.com/en/3.1.x/) template (using [@huggingface/jinja](https://www.npmjs.com/package/@huggingface/jinja)).

```js
const rendered = parsers.jinja("Today is {{date}}.", { date: new Date() })
```

## tidyData

A set of data manipulation options that is internally
used with `defData`.

```js
const d = parsers.tidyData(rows, { sliceSample: 100, sort: "name" })
```

## hash

Utility to hash an object, array into a string that is appropriate for hashing purposes.

```js
const h = parsers.hash({ obj, other }, { length: 12 })
```

By default, uses `sha-1`, but `sha-256` can also be used. The hash packing logic may change between versions of genaiscript.

## Command line

Use the [parse](/genaiscript/reference/cli/commands#parse) command from the CLI to try out various parsers.

```sh
# convert any known data format to JSON
npx --yes genaiscript parse data mydata.csv
```

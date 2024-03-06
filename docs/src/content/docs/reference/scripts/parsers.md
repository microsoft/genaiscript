---
title: Parsers
sidebar:
    order: 12
---

The `parsers` object provide various parers for commomn data formats.

## JSON5

The `parsers.json5` function parses the JSON5 format.
[JSON5](https://json5.org/) is an extension to the popular JSON file format that aims to be easier to write and maintain by hand (e.g. for config files).

In general, parsing a JSON file as JSON5 does not hurt but it might be more merciful
to syntactic errors.

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

The `parsers.YAML` function parses for the [YAML format](/genaiscript/reference/scripts/yaml).
YAML is more friendly to the LLM tokenizer than JSON. YAML is commonly used in configuration
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

The `parsers.TOML` function parses for the [TOML format](https://toml.io/).
YAML is more friendly to the LLM tokenizer than JSON. YAML is commonly used in configuration
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

## CSV

The `parsers.CSV` function parses for the [CSV format](https://en.wikipedia.org/wiki/Comma-separated_values). If successful, the function returns an array of object where each object represents a row in the CSV file.

```js
const res = parsers.CSV("...")
```

The parsers will auto-detect the header names if present; otherwise you should
pass an array of header names in the options.

```js
const res = parsers.CSV("...", { delimiter: "\t", headers: ["name", "age"] })
```

## tokens

The `parsers.tokens` estimates the number of tokens in a string
for the current model. This is useful for estimating the number of prompts that can be generated from a string.

```js
const count = parsers.tokens("...")
```

## PDF

The `parsers.PDF` function reads a PDF file and attempts to cleanly convert it into a text format. Read the [/genaiscript/reference/scripts/pdf](/genaiscript/reference/scripts/pdf) for more information.

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

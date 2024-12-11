
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


Some models support forcing the output format to a JSON object, like the [JSON Object mode](https://platform.openai.com/docs/guides/text-generation/json-mode) of OpenAI.

The generated file name will be `[spec].[template].json`.

```js 'responseType: "json_object"'
script({
    responseType: "json_object",
})
```

## Schema validation

You can specify a [schema](/genaiscript/reference/scripts/schemas) through `responseSchema` which will automatically turn on the JSON mode. The output will be validated against the schema, and GenAIScript will attempt to repair the output if it is not valid. The script will fail if the output does not match the schema.

```js "responseSchema"
script({
    responseType: "json_object",
    responseSchema: {
        type: "object",
        properties: {
            name: { type: "string" },
            age: { type: "number" },
        },
        required: ["name", "age"],
    },
})
```

You can also provide an example of object and GenAIScript will generate the schema for you.

```js "responseSchema"
script({
    responseType: "json_object",
    responseSchema: { characters: [{ name: "neo", age: 30 }] },
})
```

## Inline schemas

You can also specify the [schema inline](/genaiscript/reference/scripts/schemas) in the script and use a mixed markdown/data that GenAIScript will parse.

## Structured Output

Recent models have added a [structured output](/genaiscript/reference/scripts/structured-output) mode that is more strict than JSON mode. This mode is enabled by setting `responseType` to `json_schema`.

```js "responseSchema"
script({
    responseType: "json_schema",
    responseSchema: {...},
})
```


The `defOutputProcessor` function registers a callback to perform custom processing of the LLM output at the end of the generation process. This function allows the creation of new files or modification of existing ones.

:::caution

This feature is experimental and may change in the future.

:::

```js
// compute a filepath
const output = path.join(path.dirname(env.spec), "output.txt")
// post processing
defOutputProcessor(output => {
    return {
        files: [
            // emit entire content to a specific file
            [output]: output.text
        ]
    }
})
```

## Cleaning generated files

This example clears the `fileEdits` object, which contains the parsed file updates.

```js
defOutputProcessor((output) => {
    // clear out any parsed content
    for (const k of Object.keys(output.fileEdits)) {
        delete output.fileEdits[k]
    }
})
```

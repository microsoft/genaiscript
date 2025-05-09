The `env.output` object is used to build a markdown output for your script execution. It provides methods to add text, images, tables, and other elements to the output.

```js
const { output } = env

output.heading(3, "Analysis report")
```

The LLM response from the main script is automatically added to the output as well.

```js
const { output } = env

output.heading(3, "A poem...")

$`Write a poem` // piped to output as well
```

## Markdown support

- heading

```js wrap
output.heading(2, "Project Overview")
```

- fenced code block

```js wrap
output.fence("let x = 0", "js")
```

- fenced code block in a details

```js
output.detailsFence("code", "let x = 0", "js")
```

- warning, note, caution

```js
output.warn("Probably not a good idea.")
```

- image

```js wrap
output.image("https://example.com/image.png", "Sample Image")
```

- table example

```js wrap
output.table([
    { Name: "Alice", Role: "Developer" },
    { Name: "Bob", Role: "Designer" },
])
```

- result item

```js
output.resultItem(true, "All tests passed successfully.")
output.resultItem(false, "There were errors in the deployment process.")
```

- details

```js wrap
output.startDetails("Deployment Details", { success: true, expanded: true })
output.appendContent("Deployment completed on 2024-04-27.")
output.endDetails()
```

There are more functions available in the `OutputBuilder` interface.

## cli

You can specify a file location for the output file using the `--out-output` flag in the [run](/genaiscript/reference/cli/run) command.

```sh
genaiscript run ... --out-output ./output.md
```
Scripting environment with convenient tooling for file ingestion, prompt development and structured data extraction.

[![A screenshot of a code editor with multiple tabs open, showing TypeScript code for a "Code Optimizer" script. The editor displays a script with a class named "Greeter" and a description of optimizing code performance. The right pane previews the script's output and optimization suggestions. The left sidebar contains file navigation and icons for various functions.](https://microsoft.github.io/genaiscript/images/visual-studio-code.png)](https://microsoft.github.io/genaiscript/images/visual-studio-code.png)

-   👀 **Read the documentation at https://microsoft.github.io/genaiscript/**

## Features

-   💵 Prompt programmatically using stylized [JavaScript](https://microsoft.github.io/genaiscript/genaiscript/reference/scripts/).

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" })
// define the data
const schema = defSchema("DATA", { type: "array", items: { type: "string" } })
// define the task
$`Analyze FILE and
  extract titles to JSON compliant with ${schema}.`
```

-   ⚡️ Edit, [debug](https://microsoft.github.io/genaiscript/genaiscript/getting-started/debugging-scripts/), [run](https://microsoft.github.io/genaiscript/genaiscript/getting-started/running-scripts/) your scripts

![A screenshot of a Visual Studio Code interface in debug mode, showing a paused breakpoint in a JavaScript file. The left side displays the "WATCH" and "CALL STACK" panels, while the right side shows code involving a filter function and a Python file label.](https://microsoft.github.io/genaiscript/images/vscode-debugger.png)

-   📁 Scripts are [files](https://microsoft.github.io/genaiscript/reference/scripts/)! They can be versioned, shared, forked, ...

-   📊 Define, validate, repair data using [schemas](https://microsoft.github.io/genaiscript/reference/scripts/schemas).

```js wrap
const data = defSchema("MY_DATA",
    { type: "array", items: { ... }, })
$`Extract data from files using ${data} schema.`
```

-   📄 Ingest PDFs, DOCX, CSV, ...
    [PDFs](https://microsoft.github.io/genaiscript/reference/scripts/pdf),
    [DOCX](https://microsoft.github.io/genaiscript/reference/scripts/docx),
    [CSV](https://microsoft.github.io/genaiscript/reference/scripts/csv), ...

```js
const { pages } = await parsers.PDF(env.files[0])
```

-   🔍 [Vector search](https://microsoft.github.io/genaiscript/reference/scripts/vector-search/)

```js wrap
// embedding vector index and search
const files = await retrieval.vectorSearch("cats", env.files)
```

-   🚀 Automate using the [CLI](https://microsoft.github.io/genaiscript/reference/cli).

```bash frame="none" wrap
npx --yes genaiscript run my-script "*.pdf"
```

-   👯 [compose prompts](https://microsoft.github.io/genaiscript/reference/scripts/inline-prompts/) within prompts

```js wrap
// summarize each files individually
for (const file of env.files) {
    const { text } = await runPrompt((_) => {
        _.def("FILE", file)
        _.$`Summarize the FILE.`
    })
    // use result in main prompt
    _.def("SUMMARY", text)
}
// use summary
$`Summarize all the summaries.`
```

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

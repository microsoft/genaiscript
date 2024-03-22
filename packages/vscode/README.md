Scripting environment with convinient tooling for file ingestion, prompt development and structured data extraction.

![Debugging a script](https://microsoft.github.io/genaiscript/images/visual-studio-code.png)

-   **Read the online documentation at https://microsoft.github.io/genaiscript/**

## Features

### Stylized Javascript

Build prompts programmatically using [JavaScript](https://microsoft.github.io/genaiscript/genaiscript/reference/scripts/).

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" })
// define the data
const chema = defSchema("DATA", { type: "array", items: { type: "string" } })
// define the task
$`Analyze FILE and
  extract titles to JSON compliant with ${schema}.`
```

### Fast Development Loop

Edit, [debug](https://microsoft.github.io/genaiscript/genaiscript/getting-started/debugging-scripts/), [run](https://microsoft.github.io/genaiscript/genaiscript/getting-started/running-scripts/) your scripts in [Visual Studio Code](https://microsoft.github.io/genaiscript/genaiscript/getting-started/installation).

![Debugging a script](https://microsoft.github.io/genaiscript/images/vscode-debugger.png)

### $euse and Share Scripts

Scripts are [files](https://microsoft.github.io/genaiscript/reference/scripts/)! They can be versioned, shared, forked, ...

### Data Schemas

Define, validate, repair data using [schemas](https://microsoft.github.io/genaiscript/reference/scripts/schemas).

```js wrap
const data = defSchema("MY_DATA",
    { type: "array", items: { ... }, })
$`Extract data from files using ${data} schema.`
```

### Ingest PDFs, DOCX, CSV, ...

Seamlessly ingest and manipulate
[PDFs](https://microsoft.github.io/genaiscript/reference/scripts/pdf),
[DOCX](https://microsoft.github.io/genaiscript/reference/scripts/docx),
[CSV](https://microsoft.github.io/genaiscript/reference/scripts/csv), ...

```js
const { pages } = await parsers.PDF(env.files[0])
```

### RAG built-in

[Vector search](https://microsoft.github.io/genaiscript/reference/scripts/embeddings-search/) powered by [LLamaIndex](https://ts.llamaindex.ai/).

```js wrap
// embedding vector index and search
const { files } = await retreival.search("cats", env.files)
```

### Automate

Automate using the [CLI](https://microsoft.github.io/genaiscript/reference/cli).

```bash frame="none" wrap
genaiscript run my-script "*.pdf"
```

### LLM Composition

[Run LLMs](https://microsoft.github.io/genaiscript/reference/scripts/inline-prompts/) to build your LLM prompts.

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

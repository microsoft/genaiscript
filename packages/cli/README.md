# GenAIScript

Scripting environment with convenient tooling for file ingestion, prompt development and structured data extraction.

```js
// define the context
def("FILE", env.files, { endsWith: ".pdf" })
// define the data
const schema = defSchema("DATA",
  { type: "array", items: { type: "string" } })
// define the task
$`Analyze FILE and
  extract titles to JSON compliant with ${schema}.`
```

-   **Read the online documentation at https://microsoft.github.io/genaiscript/**

## Contributing

We accept contributions! Checkout the [CONTRIBUTING](./CONTRIBUTING.md) page for details and developer setup.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

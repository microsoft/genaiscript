# GenAIScript - Generative AI Scripting

[GenAIScript](https://aka.ms/genaiscript) (formerly GPTools, CoArch) allows teams, including non-developers, to create and use GenAI-enhanced scripts. GenAIScript uses LLMs to enable a new kind of scripting that combines traditional code and natural language.

```js
script({ title: "Code XRay" })

def("FILE", env.files.filter(f => !f.filename.endsWith(".xray")))

$`You are an expert at programming in all known languages.
For each FILE, extract the code structure
that ignores the internal details of the implementation.'
```

-   **Read the online documentation at https://red-mud-00ce5491e.5.azurestaticapps.net/genaiscript

## Contributing

We accept contributions! Checkout the [CONTRIBUTING](./CONTRIBUTING.md) page for details and developer setup.

## Outdated videos

-   🔑 [Building a Azure Bicep Analyzer](https://github.com/microsoft/genaiscript/assets/4175913/d8e9f080-9e47-4667-b10a-ea5b544b1125)
-   💬 [Copilot Chat to GenAIScript](https://github.com/microsoft/genaiscript/assets/4175913/7bf8e458-8dac-4021-b820-b95237aad7b8)
-   📑 [Structured Data Extraction](https://github.com/microsoft/genaiscript/assets/4175913/907ca886-7344-4341-986c-e288148fd501)
-   🎥 [Video transcript converter](https://github.com/microsoft/genaiscript/assets/4175913/9b49d291-91f2-4739-b8f4-aa4332dc08ac)

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

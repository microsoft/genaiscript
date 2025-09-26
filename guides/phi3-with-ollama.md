import { Steps } from '@astrojs/starlight/components';

[Phi-3 Mini](https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/) 
is a 3.8B parameters, lightweight, state-of-the-art open model by Microsoft.
In this guide, we use [Ollama](https://ollama.com/), 
a desktop application that let you download and run model locally.

<Steps>

<ol>

<li>

Start the Ollama application or run the command to launch the server from a terminal.

```sh
ollama serve
```

</li>

<li>

(optional) Pull your model from the Ollama server (see [list of models](https://ollama.com/library)).
GenAIScript will automatically attempt to pull it if missing.

```sh
ollama pull phi3
```

</li>

<li>

Update your script to use the `ollama:phi3` model.

```js title="summarize-phi3.genai.mjs" "ollama:phi3"
script({
    model: "ollama:phi3",
    title: "summarize with phi3",
    system: ["system"],
})

const file = def("FILE", env.files)
$`Summarize ${file} in a single paragraph.`
```

</li>

<li>

Apply this script to the files you want to summarize!

</li>

</ol>

</Steps>
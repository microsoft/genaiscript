import { Code } from "@astrojs/starlight/components"
import sampleSrc from "../../../../../packages/sample/genaisrc/summary-with-transformers.genai?raw"


HuggingFace [Transformers.js](https://huggingface.co/docs/transformers.js/index) is a JavaScript library
that lets you run pretrained models locally on your machine. The library uses [onnxruntime](https://onnxruntime.ai/)
to leverage the CPU/GPU capabilities of your hardware.

In this guide, we will show how to create [summaries](https://huggingface.co/tasks/summarization) using the [Transformers.js](https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.SummarizationPipeline) library.

:::tip

Transformers.js has an extensive list of tasks available. This guide will only cover one but checkout their [documentation](https://huggingface.co/docs/transformers.js/pipelines#tasks)
for more.

:::

## Installation

Following the [installation instructions](https://huggingface.co/docs/transformers.js/installation), 
we add the [@xenova/transformers](https://www.npmjs.com/package/@xenova/transformers) to the current project.

```bash
npm install @xenova/transformers
```

You can also install this library globally to be able to use on any project

```bash "-g"
npm install -g @xenova/transformers
```

## Import the pipeline

The snippet below imports the Transformers.js library and loads the summarizer pipeline and model.
You can specify a model name or let the library pick the latest and greatest.

```js
import { pipeline } from "@xenova/transformers"
const summarizer = await pipeline("summarization")
```

Allocating and loading the model can take some time, 
so it's best to do this at the beginning of your script
and only once.

:::note[Migrate your script to `.mjs`]

To use the `Transformers.js` library, you need to use the `.mjs` extension for your script (or `.mts` for TypeScript support).
If your script is ending in `.genai.js`, rename it to `.genai.mjs`.

:::

## Invoke the pipeline

The summarizer pipeline has a single argument, the content to summarize. It returns an array of summaries
which we need to unpack to access the final summary text. This is what we do below and `summary_index` contains the summary text.

```js
const [summary] = await summarizer(content)
// @ts-ignore
const { summary_text } = summary
```

## Final code

The example below generates a summary of each input file
before letting the model generate a full summary.

<Code
    title="transformers.genai.mjs"
    code={sampleSrc}
    wrap={true}
    lang="js"
/>

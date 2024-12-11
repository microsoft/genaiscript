
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/samples/iat.genai.mts?raw"

Alt text is essential for making images accessible to everyone, including those with visual impairments. It provides a textual description of the image, allowing screen readers to convey the content to users who can't see the image.
However, writing alt text for images can be time-consuming, especially when dealing with a large number of images. This is where AI can help. By using a language model like OpenAI's GPT-4, you can generate alt text for images automatically, thus saving you time and effort.

In this sample, we will build a tool that generates alt text for images in Markdown files.

## Configuring the script

This script is composed of TypeScript code, designed to run with the GenAIScript CLI. Let's break it down:

```ts
script({
    title: "Image Alt Textify",
    description: "Generate alt text for images in markdown files",
    parameters: {
        docs: {
            type: "string",
            description: "path to search for markdown files",
            default: "**.{md,mdx}",
        },
        force: {
            type: "boolean",
            description: "regenerate all descriptions",
            default: false,
        },
        assets: {
            type: "string",
            description: "image assets path",
            // change the default path to your assets folder
            default: "./assets/images",
        },
    },
})
```

Here we declare the script with a title and description, specifying it uses OpenAI's GPT-4 model.
We also set parameters for the file paths, choice to regenerate all descriptions, and the assets path.

Next, we extract environmental variables:

```ts
const { docs, force, assets } = env.vars
```

## Searching for images

Following that, we define a regular expression to find images in Markdown:

```ts
const rx = force
    ? // match ![alt?](path) with alt text or not
      /!\[[^\]]*\]\(([^\)]+\.(png|jpg))\)/g
    : // match ![](path) without alt text
      /!\[\s*\]\(([^\)]+\.(png|jpg))\)/g

const { files } = await workspace.grep(rx, {
    path: docs,
    glob: "*.{md,mdx}",
    readText: true,
})
```

The script uses [workspace.grep](/genaiscript/reference/scripts/files#grep) to find all occurrences of the regex pattern in the specified documents.

## Generating alt text

For each image URL found, we generate alt text using an [inline prompt](/genaiscript/reference/scripts/inline-prompts)
and [defImages](/genaiscript/references/scripts/images).

```ts
for (const file of files) {
    const { filename, content } = file

    // map documentation relative path to assets path
    const url = resolveUrl(filename)

    // execute a LLM query to generate alt text
    const { text } = await runPrompt(
        (_) => {
            _.defImages(resolvedUrl)
            _.$`
                You are an expert in assistive technology.

                You will analyze the image
                and generate a description alt text for the image.

                - Do not include alt text in the description.
                - Keep it short but descriptive.
                - Do not generate the [ character.`
        },
        {
            // safety system message to prevent generating harmful text
            system: ["system.safety_harmful_content"],
            // use multi-model model
            model: "openai:gpt-4o",
            ...
        }
    )

    imgs[url] = text
}
```

## Updating files

Finally, we update the Markdown content with the generated alt text:

```ts
const newContent = content.replace(
    rx,
    (m, url) => `![${imgs[url] ?? ""}](${url})`
)
if (newContent !== content) await workspace.writeText(filename, newContent)
```

We replace the placeholder in the original content with the alt text and save the updated file.

## 💻 How to Run the Script

To run this script, you'll need the GenAIScript CLI. If you haven't installed it yet, check out the [installation guide](https://microsoft.github.io/genaiscript/getting-started/installation).

Once you have the CLI, you can run the script with the following command:

```bash
npx genaiscript run iat
```

## Safety

The script imports a default safety system message to prevent generating harmful text.

```js
    // safety system message to prevent generating harmful text
    system: ["system.safety_harmful_content"],
```

In Azure OpenAI deployments, you can also turn on [content filters](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter)
to prevent accidentally generating harmful content.

## Full source ([GitHub](https://github.com/microsoft/genaiscript/blob/main/packages/sample/genaisrc/samples/iat.genai.mts))

<Code code={source} wrap={true} lang="ts" title="iat.genai.mts" />

## Content Safety

The following measures are taken to ensure the safety of the generated content.

-   This script includes system prompts to prevent prompt injection and harmful content generation.
    - [system.safety_jailbreak](/genaiscript/reference/scripts/system#systemsafety_jailbreak)
    - [system.safety_harmful_content](/genaiscript/reference/scripts/system#systemsafety_harmful_content)
-   The generated description is saved to a file at a specific path, which allows for a manual review before committing the changes.

Additional measures to further enhance safety would be to run [a model with a safety filter](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/content-filter?tabs=warning%2Cuser-prompt%2Cpython-new)
or validate the message with a [content safety service](/genaiscript/reference/scripts/content-safety).

Refer to the [Transparency Note](/genaiscript/reference/transparency-note/) for more information on content safety.

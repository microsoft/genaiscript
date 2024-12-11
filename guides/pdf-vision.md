
import { Code } from "@astrojs/starlight/components"
import source from "../../../../../packages/sample/genaisrc/pdfocr.genai.mts?raw"

Extracting markdown from PDFs is a tricky task... the PDF file format was never really meant to be read back.

There are many techniques applied in the field to get the best results:

-   one can read the text using [Mozilla's pdfjs](https://mozilla.github.io/pdf.js/) (GenAIScript uses that), which may give some results but the text might be garbled or not in the correct order. And tables are a challenge. And this won't work for PDFs that are images only.
-   another technique would be to apply OCR algorithm on segments of the image to "read" the rendered text.

In this guide, we will build a GenAIScript that uses a LLM with vision support to extract text and images from a PDF, converting each page into markdown.

Let's assume that the user is running our script on a PDF file, so it is the first element of `env.files`.
We use the PDF parser to extract both the pages and images from the PDF file. The `renderAsImage` option is set to `true`, which means each page is also converted into an image.

```ts "renderAsImage: true"
const { pages, images } = await parsers.PDF(env.files[0], {
    renderAsImage: true,
})
```

We begin a loop that iterates over each page in the PDF.

```ts
for (let i = 0; i < pages.length; ++i) {
    const page = pages[i]
    const image = images[i]
```

For each iteration, we extract the current page and its corresponding image.
We use the `runPrompt` function to process both text and image data.

```ts
    // mix of text and vision
    const res = await runPrompt(
        (ctx) => {
            if (i > 0) ctx.def("PREVIOUS_PAGE", pages[i - 1])
            ctx.def("PAGE", page)
            if (i + 1 < pages.length) ctx.def("NEXT_PAGE", pages[i + 1])
            ctx.defImages(image, { autoCrop: true, greyscale: true })
```

The context `ctx` is set up with definitions for the current page, and optionally the previous and next pages. Images are defined with auto-cropping and greyscale adjustments.

```ts
ctx.$`You are an expert in reading and extracting markdown from a PDF image stored in the attached images.

            Your task is to convert the attached image to markdown.

            - We used pdfjs-dist to extract the text of the current page in PAGE, the previous page in PREVIOUS_PAGE and the next page in NEXT_PAGE.
            - Generate markdown. Do NOT emit explanations.
            - Generate CSV tables for tables.
            - For images, generate a short alt-text description.
        `
```

This prompt instructs GenAI to convert the page image into markdown. It highlights the use of `pdfjs-dist` for text extraction and instructs how to handle text, tables, and images.

```ts
        },
        {
            model: "small",
            label: `page ${i + 1}`,
            cache: "pdf-ocr",
            system: [
                "system",
                "system.assistant",
                "system.safety_jailbreak",
                "system.safety_harmful_content",
            ],
        }
    )
```

We configure the model with specific settings, such as labeling each page, caching settings, and system configurations for safety.

```ts
    ocrs.push(parsers.unfence(res.text, "markdown") || res.error?.message)
}
```

Each result is processed, converted back to markdown, and added to the `ocrs` array.

```ts
console.log(ocrs.join("\n\n"))
```

Finally, we print out all the collected OCR results in markdown format.

## Running the Script

To run this script using the GenAIScript CLI, navigate to your terminal and execute:

```bash
npx --yes genaiscript run pdfocr <mypdf.pdf>
```

For more details on installing and setting up the GenAIScript CLI, refer to the [official documentation](https://microsoft.github.io/genaiscript/getting-started/installation).

This script provides a straightforward way to convert PDFs into markdown, making it easier to work with their contents programmatically. Happy coding! 🚀

## Full source

The full script source code is available below:

<Code code={source} wrap={true} lang="js" title="pdfocr.genai.mts" />

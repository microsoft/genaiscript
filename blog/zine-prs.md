import { Code } from "@astrojs/starlight/components"
import code from "../../../../../packages/sample/genaisrc/samples/prd-zine.genai.mts?raw"
import sketchCode from "../../../../../packages/sample/genaisrc/samples/prd-sketch.genai.mts?raw"
import BlogNarration from "../../../components/BlogNarration.astro"

<BlogNarration />

The availability of new image generators like OpenAI `gpt-image-1` opens
the door to endless new ways to visualize and annotate software artifacts.

:::tip

It also works for **sketchnotes!**

:::

## Zines

["Zine"](https://en.wikipedia.org/wiki/Zine) is a popular graphic art form that combines text and images to tell a story.
Can we prompt the LLM to generate a zine from a pull request diff? _offline robotic voice: Yes we can_.

The script below is a 2 step LLM transformation of the pull request into a zine:

- use `gpt-4.1-mini` to transform the diff into a image generation prompt
- use `gpt-image-1` to generate the image from the prompt
-   - a bit of plumbing to upload the generated image into a branch and add it to the pull request description

<Code code={code} lang="ts" wrap title="prd-zine.genai.mts" />

- https://github.com/microsoft/genaiscript/pull/1505

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/522d1313a72276c6e257e8515aef10cefca29020918382165d523bed3ac84744.jpg)

- https://github.com/microsoft/genaiscript/pull/1503

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/ac75c0e82897b9bc80b7bdbab503dacdee16da762f1048ae20d163c4d1b5e7ac.jpg)

- https://github.com/microsoft/genaiscript/pull/1507

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/1a2f6bff55de7c004d46cfd9b014b598f2be4903702095aaea02c01c95e0df4d.jpg)

- https://github.com/microsoft/genaiscript/pull/1506

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/1b560d071efb015942678ffc705eac01e0d1dad8fd1e88ab521c0283a535a278.jpg)

## Sketchnotes (updated)

["Sketchnotes"](https://sketchyideas.co/sketchnotes/) is another style of visual note-taking that combines hand-drawn elements with text to convey information.
It is a great way to summarize a pull request and make it more engaging.

<Code code={sketchCode} lang="ts" wrap title="prd-sketch.genai.mts" />

- https://github.com/microsoft/genaiscript/pull/1510

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/034e747af0809c2ed0ed02f5e980cce1f48a6f80e0a3c63818694d3afa34647a.jpg)

- https://github.com/microsoft/genaiscript/pull/1511

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/d9461598f48703dceb7e4dd381292b713c993dbbde2dec3f2b2b18858d774dfb.jpg)

## What about other styles?

Pushing the idea even further, we can ask the LLM to pick a random graphical style and generate a pull request diff in that style.
This idea was applied in https://github.com/microsoft/genaiscript/pull/1512.

- collage

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/0cfbcad27efd026c72d23b2d75e801add50a67a7061585e8c680299e2fe8dae6.jpg)

- mural

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/a672ed828a6fa1e5dc2561f120f9c35353a2ba27a10cc285a0d40c4a68581e66.jpg)

- editorial illustration

![](https://raw.githubusercontent.com/microsoft/genaiscript/refs/heads/genai-assets/c5478b3f3015ee93578984a0c19874b5310fb556290309995077fb1f6077daa9.jpg)

## More to come

The zine is a fun way to visualize the pull request diff. It is not perfect but it is inviting
and maybe this is all you need to get someone to review your PR!

There will be more ways to visualize software in the future, thanks to these amazing image generators.
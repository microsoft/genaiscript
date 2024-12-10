
import { Image } from "astro:assets"
import { Code } from "@astrojs/starlight/components"
import scriptSrc from "../../../../genaisrc/image-alt-text.genai.mjs?raw"
import src from "../../../assets/debugger.png"
import alt from "../../../assets/debugger.png.txt?raw"

It is a best practice to provide an `alt` attribute for images.
This attribute is used to describe the image to users who are unable to see it.
It is also used by search engines to understand the content of the image.

```html "alt"
<img src="..." alt="describe the image here" />
```

However, this task can be tedious and developers are often tempted to skip it, or provide a generic `alt` text like "image".

```html
<img src="..." alt="image" />
```

## The script

To solve this issue, we created a script that uses the OpenAI Vision model to analyze the documentation
images and generate a description alt text.

To start, we assume that the script is run on a single image file
and we use [defImage](/genaiscript/reference/scripts/images) to add it to the prompt context.

```js title="image-alt-text.genai.mjs"
const file = env.files[0]
defImages(file)
```

Then we give a task to the LLM to generate a good alt text.

```js title="image-alt-text.genai.mjs" wrap
...
$`You are an expert in assistive technology. You will analyze each image
and generate a description alt text for the image.`
```

finally, we use [defFileOutput](/genaiscript/reference/scripts/file-ouput) to define
a file output route.

```js title="image-alt-text.genai.mjs" wrap
...
defFileOutput(file.filename + ".txt", `Alt text for image ${file.filename}`)
```

## Usage in Astro

The GenAIScript documentation uses Astro, which allows to author pages in [MDX](https://docs.astro.build/en/guides/markdown-content/).
The code below shows how the generated alt text, stored in a separate text file, is injected in the final HTML.

```mdx
import { Image } from "astro:assets"
import src from "../../../assets/debugger.png"
import alt from "../../../assets/debugger.png.txt?raw"

<Image src={src} alt={alt} />
```

The `debugger.png` image shows the screenshot of a debugging session and the generated alt text file contents.

<Image src={src} alt={alt} />

<Code code={alt} wrap={true} lang="txt" title="debugger.png.txt" />

## Automation

Using the [run](/genaiscript/reference/cli/run) command, we can apply the script to each image in the docs.

```sh
for file in assets/**.png; do
  npx --yes genaiscript run image-alt-text "$file"
```

To avoid regenerating the alt text, we also detect if a file exists in the script and cancel accordingly.

```sh title="image-alt-text.genai.mjs" wrap
for file in assets/**.png; do
  if [ ! -f "$file" ]; then
    npx --yes genaiscript run image-alt-text "$file"
  fi
done
```

## Full source

The full source looks like this:

<Code code={scriptSrc} wrap={true} lang="js" title="image-alt-text.genai.mjs" />

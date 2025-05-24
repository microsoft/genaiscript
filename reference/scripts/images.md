import { YouTube } from "astro-embed"

Images can be added to the prompt for models that support this feature (like `gpt-4o`).
Use the `defImages` function to declare the images. Supported images will vary
with models but typically include `PNG`, `JPEG`, `WEBP`, and `GIF`. Both local files and URLs are supported.

```js
defImages(env.files)
```

<YouTube id="https://youtu.be/XbWgDn7NdTg" posterQuality="high" />

Read more about [OpenAI Vision](https://platform.openai.com/docs/guides/vision/limitations).

## URLs

Public URLs (that do not require authentication) will be passed directly to OpenAI.

```js wrap
defImages(
    "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/logo.png?raw=true"
)
```

Local files are loaded and encoded as a data uri.

## Buffer, Blob, ReadableStream

The `defImages` function also supports [Buffer](https://nodejs.org/api/buffer.html), 
[Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob), [ReadableStream](https://nodejs.org/api/stream.html).

This example takes a screenshot of bing.com and adds it to the images.

```js wrap
const page = await host.browse("https://bing.com")
const screenshot = await page.screenshot() // returns a node.js Buffer
defImages(screenshot)
```

## Detail

OpenAI supports a "low" / "high" field. An image in "low" detail
will be downsampled to 512x512 pixels.

```js 'detail: "low"'
defImages(img, { detail: "low" })
```

## Cropping

You can crop a region of interest from the image.

```js "crop: { x: 0, y: 0, w: 512, h: 512 }" wrap
defImages(img, { crop: { x: 0, y: 0, w: 512, h: 512 } })
```

## Auto crop

You can also automatically remove uniform color on the edges of the image.

```js "autoCrop" wrap
defImages(img, { autoCrop: true })
```

## Greyscale

You can convert the image to greyscale.

```js "greyscale" wrap
defImages(img, { greyscale: true })
```

## Rotate

You can rotate the image.

```js "rotate: 90"
defImages(img, { rotate: 90 })
```

## Scale

You can scale the image.

```js "scale: 0.5"
defImages(img, { scale: 0.5 })
```

## Flip

You can flip the image.

```js "flip: { horizontal: true; vertical: true }" wrap
defImages(img, { flip: { horizontal: true; vertical: true } })
```

## Max width, max height

You can specify a maximum width, maximum height. GenAIScript will resize
the image to fit into the constraints.

```js "maxWidth: 800" "maxHeight: 800"
defImages(img, { maxWidth: 800 })
// and / or
defImages(img, { maxHeight: 800 })
```
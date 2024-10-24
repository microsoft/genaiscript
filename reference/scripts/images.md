
Images can be added to the prompt for models that support this feature (like `gpt-4o`).
Use the `defImages` function to declare the images. Supported images will vary
with models but typically include `PNG`, `JPEG`, `WEBP`, and `GIF`. Both local files and URLs are supported.

```js
defImages(env.files)
```

Read more about [OpenAI Vision](https://platform.openai.com/docs/guides/vision/limitations).

## URLs

Public URLs (that do not require authentication) will be passed directly to OpenAI.

```js
defImages(
    "https://github.com/microsoft/genaiscript/blob/main/docs/public/images/logo.png?raw=true"
)
```

Local files are loaded and encoded as a data uri.

## Buffer, Blob

The `defImages` function also supports [Buffer](https://nodejs.org/api/buffer.html)
and [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob).

This example takes a screenshot of bing.com and adds it to the images.

```js
const page = await host.browse("https://bing.com")
const screenshot = await page.screenshot() // returns a node.js Buffer
defImages(screenshot)
```

## Detail

OpenAI supports a "low" / "high" field.

```js 'detail: "low"'
defImages(img, { detail: "low" })
```

## Scaling

You can specify a maximum width, maximum height. GenAIScript will resize
the image to fit into the constraints.

```js "maxWidth: 800" "maxHeight: 800"
defImages(img, { maxWidth: 800 })
// and / or
defImages(img, { maxHeight: 800 })
```

## Auto cropping

You can automatically remove uniform color on the edges of the image.

```js "autoCrop"
defImages(img, { autoCrop: true })
```

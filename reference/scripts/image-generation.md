GenAIScript support LLM providers with [OpenAI-compatible image generation APIs](https://platform.openai.com/docs/guides/images).

## Supported providers

You will need to configure a LLM provider that support image generation.

- [OpenAI](/genaiscript/configuration/openai)
- [Azure OpenAI](/genaiscript/configuration/azure-openai)
- [Azure AI Foundry](/genaiscript/configuration/azure-ai-foundry)

## Generate an image

The top-level script (main) cannot be configured to generate an image at the moment; it has be done a function call to `generateImage`.

`generateImage` takes a prompt and returns an image URL and a revised prompt (optional).

```js "generateImage" wrap
const { image, revisedPrompt } = await generateImage(
    `a cute cat. only one. photographic, high details. 4k resolution.`
)
```

The `image` object is an image file that can be passed around for further processing.

```js
env.output.image(image.filename)
```

## Image transformation options

The `generateImage` function supports transformation options directly in the options parameter.
You can apply transformations like resizing, cropping, rotating, and more during image generation.

```js "maxWidth: 800" "quality: 'high'"
const { image } = await generateImage(
    `a landscape photo of mountains`,
    {
        maxWidth: 800,
        maxHeight: 600,
        quality: "high",
        size: "landscape"
    }
)
```

### Available transformation options

The same transformation options available for [`defImages`](/genaiscript/reference/scripts/images) are supported:

- **`maxWidth`**, **`maxHeight`**: Resize image to fit within dimensions
- **`crop`**: Crop to specific region `{ x: 0, y: 0, w: 512, h: 512 }`
- **`autoCrop`**: Remove uniform color edges automatically  
- **`scale`**: Apply scaling factor (e.g., `0.5` for half size)
- **`rotate`**: Rotate by degrees (e.g., `90`)
- **`flip`**: Flip horizontally/vertically `{ horizontal: true, vertical: true }`
- **`greyscale`**: Convert to greyscale
- **`mime`**: Output format (`"image/jpeg"` or `"image/png"`)

## Edit mode

The `generateImage` function supports an "edit" mode that uses OpenAI's image editing capabilities to modify existing images using text prompts. This mode maps directly to OpenAI's image edit API.

```js "mode: 'edit'" "image: existingImage"
// First, you need an existing image to edit
const existingImage = env.files.find(f => f.filename.includes("robot.png"))

// Edit the image using AI
const { image } = await generateImage(
    `Add sunglasses to the robot`,
    {
        mode: "edit",
        image: existingImage,  // Required for edit mode
        size: "1024x1024"
    }
)
```

### Edit mode with mask

You can optionally provide a mask to specify which parts of the image should be edited:

```js "mask: maskImage"
const { image } = await generateImage(
    `Make the background a sunset scene`,
    {
        mode: "edit", 
        image: existingImage,
        mask: maskImage,  // Optional: specifies areas to edit
        quality: "high"
    }
)
```

**Requirements for edit mode:**
- `mode: "edit"` must be specified
- `image` parameter is required (the image to edit)
- `mask` parameter is optional (specifies which areas to modify)
- The edit prompt describes the desired changes
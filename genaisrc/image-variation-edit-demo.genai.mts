script({
    title: "Image Variation and Edit Demo",
    description: "Demonstrates the new image variation and edit capabilities",
    model: "openai:gpt-image-1",
    group: "Image Processing"
})

$`# Image Variation and Edit Demo

This script demonstrates the new image variation and edit features implemented for GenAIScript.

## New Functions Available:

### 1. generateImageVariation(image, options)
Generate stylistic variations of an existing image.

### 2. generateImageEdit(image, prompt, options)
Edit an image with a text prompt and optional mask for inpainting/outpainting.

## Example Usage:

First, let's generate a base image:
`

const { image } = await generateImage("A cute cat sitting on a windowsill, 8-bit pixel art style", {
    model: "openai:gpt-image-1",
    size: "1024x1024",
    quality: "high"
})

$`Generated base image: ${image.filename}

Now let's create some variations of this image:
`

const { images: variations } = await generateImageVariation(image, {
    model: "openai:gpt-image-1",
    n: 2,
    size: "1024x1024"
})

$`Created ${variations.length} variations:
${variations.map(img => `- ${img.filename}`).join('\n')}

Now let's edit the original image by adding a hat:
`

const { images: edits, revisedPrompt } = await generateImageEdit(
    image,
    "Add a red Santa hat on the cat's head",
    {
        model: "openai:gpt-image-1",
        n: 1,
        size: "1024x1024",
        quality: "high"
    }
)

$`Created ${edits.length} edited image(s):
${edits.map(img => `- ${img.filename}`).join('\n')}

Revised prompt used by the model: "${revisedPrompt}"

## Key Features Demonstrated:

1. **Image Generation**: Standard text-to-image generation
2. **Image Variation**: Creating stylistic variations without prompts  
3. **Image Editing**: Modifying images with text descriptions
4. **Multiple Outputs**: Generating multiple variations/edits at once
5. **Model Control**: Using GPT-Image-1 for advanced capabilities
6. **Quality Control**: High quality settings for best results

## Technical Details:

- All functions return WorkspaceFile objects with proper metadata
- Images are automatically processed and cached
- Functions support all OpenAI image models (DALL-E 2, DALL-E 3, GPT-Image-1)
- Full error handling and validation
- Support for various image formats (PNG, JPEG, WebP)
- Azure OpenAI compatibility included

This implementation provides a complete solution for image manipulation workflows in GenAIScript!
`
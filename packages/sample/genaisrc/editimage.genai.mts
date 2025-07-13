script({
    title: "Edit Image with GenAI",
    description: "Demonstrates image editing capabilities using generateImage with type: 'edit'",
    model: "gpt-image-1",
    files: "src/robots.jpg",
})

const { output } = env

// Load an image file to edit
const imageFile = env.files[0]

// Edit the image with a descriptive prompt
const { image, revisedPrompt } = await generateImage(
    "Transform this image into a futuristic cyberpunk scene with neon lights and a dark cityscape background",
    {
        image: imageFile,
        type: "edit",
        model: "gpt-image-1",
        quality: "high",
        size: "1024x1024"
    }
)

// Output the edited image
await output.image(image.filename)

// Show the revised prompt if available
if (revisedPrompt) {
    output.fence(revisedPrompt, "markdown")
}

output.text(`## Image Editing Demo

This script demonstrates how to use the \`generateImage\` function with image input to edit existing images.

**Parameters used:**
- \`type: "edit"\` - Specifies this is an image editing operation
- \`model: "gpt-image-1"\` - Uses OpenAI's image generation model
- \`quality: "high"\` - Requests high quality output
- \`size: "1024x1024"\` - Sets the output dimensions

The original robots.jpg image has been transformed based on the provided prompt.`)
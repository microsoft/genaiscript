script({
    title: "Create Image Variations with GenAI",
    description: "Demonstrates image variation capabilities using generateImage with type: 'variation'",
    model: "gpt-image-1",
    files: "src/robots.jpg",
})

const { output } = env

// Load an image file to create variations from
const imageFile = env.files[0]

output.heading(3, "Variation 1 (with prompt guidance)")

// Create a variation of the image with an optional prompt
const { image: variation1, revisedPrompt: revised1 } = await generateImage(
    "Make this image more artistic and stylized",
    {
        image: imageFile,
        type: "variation",
        model: "gpt-image-1",
        quality: "high",
        size: "1024x1024"
    }
)

// Output the first variation
await output.image(variation1.filename)

if (revised1) {
    output.fence(revised1, "markdown")
}

output.heading(3, "Variation 2 (algorithmic variation)")

// Create another variation without a prompt (purely algorithmic variation)
const { image: variation2, revisedPrompt: revised2 } = await generateImage(
    "",
    {
        image: imageFile,
        type: "variation",
        model: "gpt-image-1",
        quality: "high",
        size: "1024x1024"
    }
)

// Output the second variation
await output.image(variation2.filename)

if (revised2) {
    output.fence(revised2, "markdown")
}

output.text(`## Image Variations Demo

This script demonstrates how to use the \`generateImage\` function with image input to create variations of existing images.

**Parameters used:**
- \`type: "variation"\` - Specifies this is an image variation operation
- \`model: "gpt-image-1"\` - Uses OpenAI's image generation model
- \`quality: "high"\` - Requests high quality output
- \`size: "1024x1024"\` - Sets the output dimensions

**Two approaches shown:**
1. **Guided variation**: Uses a prompt to steer the variation in a specific direction
2. **Pure variation**: No prompt provided, creates algorithmic variations

The original robots.jpg image has been used to generate multiple variations.`)
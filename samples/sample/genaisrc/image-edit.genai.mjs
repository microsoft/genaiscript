// Image editing with text prompts using gpt-image-1
// This script demonstrates how to edit existing images using text prompts

script({
  title: "Image Edit with gpt-image-1",
  description: "Demonstrates image editing capabilities using text prompts",
  group: "Image Generation"
})

// Generate an edited image from an existing image
const { image } = await generateImage(
  "Add a space helmet to the robot and make the background look like Mars",
  {
    mode: "edit",
    image: "src/robots.jpg",
    model: "openai:gpt-image-1",
    quality: "high",
    size: "square"
  }
)

console.log(`✨ Generated edited image: ${image.filename}`)

// You can also add a mask to specify which parts to edit
const { image: maskedEdit } = await generateImage(
  "Replace the background with a futuristic cityscape",
  {
    mode: "edit", 
    image: "src/robots.jpg",
    // mask: "path/to/mask.png", // uncomment if you have a mask
    model: "openai:gpt-image-1",
    quality: "high",
    size: "landscape"
  }
)

console.log(`🎭 Generated masked edit: ${maskedEdit.filename}`)
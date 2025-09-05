// Advanced image editing with creative transformations
// This script demonstrates creative image editing with detailed prompts

script({
  title: "Advanced Image Edit with gpt-image-1",
  description: "Demonstrates advanced image editing capabilities with creative transformations",
  group: "Image Generation"
})
const { output } = env

// Edit the robot image with specific instructions
const { image } = await generateImage(
  "Add a colorful rainbow in the background and make the robot look more cheerful",
  {
    mode: "edit",
    image: "src/robots.jpg",
    quality: "high",
    size: "square"
  }
)

output.item(`🤖 Generated edited robot: ${image.filename}`)

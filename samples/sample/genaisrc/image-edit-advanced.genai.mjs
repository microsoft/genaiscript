// Advanced image editing with creative transformations
// This script demonstrates creative image editing with detailed prompts

script({
  title: "Advanced Image Edit with gpt-image-1",
  description: "Demonstrates advanced image editing capabilities with creative transformations",
  group: "Image Generation"
})

// Edit the robot image with specific instructions
const { image } = await generateImage(
  "Add a colorful rainbow in the background and make the robot look more cheerful",
  {
    mode: "edit",
    image: "src/robots.jpg",
    model: "openai:gpt-image-1",
    quality: "high",
    size: "square"
  }
)

console.log(`🤖 Generated edited robot: ${image.filename}`)

// Edit the mushroom image with artistic style
const { image: landscapeEdit } = await generateImage(
  "Transform this into a magical fairy tale scene with glowing lights and enchanted atmosphere",
  {
    mode: "edit",
    image: "src/images/Little Mushroom in the Grass.jpg",
    model: "openai:gpt-image-1",
    quality: "medium",
    size: "landscape"
  }
)

console.log(`🍄 Generated magical mushroom scene: ${landscapeEdit.filename}`)

// Edit the galaxy image with sci-fi elements
const { image: galaxyEdit } = await generateImage(
  "Add futuristic spaceships and nebula effects to create an epic space battle scene",
  {
    mode: "edit",
    image: "src/vision/galaxy.jpg",
    model: "openai:gpt-image-1",
    quality: "high",
    size: "portrait"
  }
)

console.log(`🌌 Generated space battle scene: ${galaxyEdit.filename}`)
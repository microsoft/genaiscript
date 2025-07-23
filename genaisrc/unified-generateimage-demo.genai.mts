script({
  title: "Unified generateImage Demo",
  description: "Demonstrates the new unified generateImage interface with explicit modes",
  group: "image generation",
  model: "openai:dall-e-3",
})

// Test the new unified generateImage interface

// 1. Generation mode (explicit)
console.log("🎨 Testing generation mode")
const generationResult = await generateImage("A cute cat wearing sunglasses", {
  mode: "generation",
  quality: "high",
  size: "1024x1024",
})
console.log("Generated image:", generationResult.image?.filename)
console.log("Revised prompt:", generationResult.revisedPrompt)

// 2. Variation mode
if (generationResult.image) {
  console.log("🔄 Testing variation mode")
  const variationResult = await generateImage("", {
    mode: "variation",
    images: [generationResult.image],
    n: 2,
  })
  console.log("Variation images:", variationResult.images?.map(img => img.filename))
}

// 3. Edit mode  
if (generationResult.image) {
  console.log("✏️ Testing edit mode")
  const editResult = await generateImage("Add a red hat on the cat's head", {
    mode: "edit",
    images: [generationResult.image],
    n: 1,
  })
  console.log("Edited images:", editResult.images?.map(img => img.filename))
  console.log("Edit revised prompt:", editResult.revisedPrompt)
}

// 4. Default mode (generation) - backward compatibility
console.log("🔙 Testing default mode (generation)")
const defaultResult = await generateImage("A dog playing with a ball", {
  quality: "high",
  size: "1024x1024",
})
console.log("Default generated image:", defaultResult.image?.filename)
script({
  title: "Unified generateImage API Demo",
  description: "Demonstrates the new unified generateImage interface with explicit modes",
  group: "image generation",
  model: "openai:dall-e-3",
})

// Test the new unified generateImage interface with explicit mode parameters

console.log("🎨 Testing new unified generateImage API")

// 1. Generation mode (explicit mode parameter)
console.log("\n1. Generation Mode")
const generationResult = await generateImage("A cute orange cat wearing sunglasses on a beach", {
  mode: "generation",
  quality: "high",
  size: "1024x1024",
  n: 1
})

if (generationResult.image) {
  console.log("✅ Generated image:", generationResult.image.filename)
  console.log("📝 Revised prompt:", generationResult.revisedPrompt)
  
  // 2. Variation mode - create variations of the generated image
  console.log("\n2. Variation Mode")
  const variationResult = await generateImage("", {
    mode: "variation",
    images: [generationResult.image],
    n: 2,
  })
  
  if (variationResult.images) {
    console.log("✅ Generated variations:")
    variationResult.images.forEach((img, i) => 
      console.log(`   Variation ${i + 1}: ${img.filename}`)
    )
  }

  // 3. Edit mode - edit the original image
  console.log("\n3. Edit Mode")
  const editResult = await generateImage("Replace the sunglasses with a red baseball cap", {
    mode: "edit",
    images: [generationResult.image],
    n: 1,
  })
  
  if (editResult.images) {
    console.log("✅ Generated edited images:")
    editResult.images.forEach((img, i) => 
      console.log(`   Edit ${i + 1}: ${img.filename}`)
    )
    console.log("📝 Edit revised prompt:", editResult.revisedPrompt)
  }
}

// 4. Default mode (backward compatibility) - mode defaults to "generation"
console.log("\n4. Default Mode (Backward Compatibility)")
const defaultResult = await generateImage("A golden retriever playing with a red ball in a park", {
  quality: "high",
  size: "1024x1024",
})

if (defaultResult.image) {
  console.log("✅ Default mode image:", defaultResult.image.filename)
  console.log("📝 Default revised prompt:", defaultResult.revisedPrompt)
}

console.log("\n🎉 All modes tested successfully!")
console.log("\n📊 API Summary:")
console.log("- mode: 'generation' | 'variation' | 'edit' (defaults to 'generation')")
console.log("- images: Array of input images for variation/edit modes")
console.log("- n: Number of images to generate")
console.log("- Returns: { image?, images?, revisedPrompt? }")
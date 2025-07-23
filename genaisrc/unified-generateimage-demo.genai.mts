script({
  title: "Unified generateImage API Demo",
  description: "Demonstrates the unified generateImage interface with mode and images in options",
  group: "image generation",
  model: "openai:dall-e-3",
})

// Test the unified generateImage interface where:
// - First argument is ALWAYS the prompt
// - mode and images are ALWAYS in the options object

console.log("🎨 Testing unified generateImage API")
console.log("📋 API Structure: generateImage(prompt, { mode, images, ...options })")

// 1. Generation mode (default)
console.log("\n1. Generation Mode")
const generationResult = await generateImage("A cute orange cat wearing sunglasses on a beach", {
  quality: "high",
  size: "1024x1024",
  n: 1
})

if (generationResult.image) {
  console.log("✅ Generated image:", generationResult.image.filename)
  console.log("📝 Revised prompt:", generationResult.revisedPrompt)
  
  // 2. Variation mode - prompt is ignored, mode and images in options
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
    console.log("🔍 Note: Prompt parameter ignored in variation mode")
  }

  // 3. Edit mode - prompt matters, mode and images in options
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

console.log("\n🎉 Unified API tested successfully!")
console.log("\n📊 API Summary:")
console.log("✅ First argument: ALWAYS the prompt (string)")
console.log("✅ Options object contains:")
console.log("   - mode: 'generation' | 'variation' | 'edit' (defaults to 'generation')")
console.log("   - images: Array of input images for variation/edit modes")
console.log("   - Other generation parameters (n, quality, size, etc.)")
console.log("✅ Returns: { image?, images?, revisedPrompt? }")
console.log("\n💡 For variation mode, prompt is ignored but still required as first parameter")
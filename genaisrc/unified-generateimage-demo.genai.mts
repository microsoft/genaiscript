script({
  title: "Unified generateImage API Demo",
  description: "Demonstrates the unified generateImage interface with ElementOrArray support for images",
  group: "image generation",
  model: "openai:dall-e-3",
})

// Test the unified generateImage interface where:
// - First argument is ALWAYS the prompt
// - mode and images are ALWAYS in the options object
// - images field supports both single images and arrays (ElementOrArray)

console.log("🎨 Testing unified generateImage API")
console.log("📋 API Structure: generateImage(prompt, { mode, images, ...options })")
console.log("🔧 images field supports ElementOrArray<string | WorkspaceFile>")

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
  
  // 2. Variation mode - using single image (not array)
  console.log("\n2. Variation Mode - Single Image")
  const variationResult = await generateImage("", {
    mode: "variation",
    images: generationResult.image, // Single image, not array!
    n: 2,
  })
  
  if (variationResult.images) {
    console.log("✅ Generated variations (from single image):")
    variationResult.images.forEach((img, i) => 
      console.log(`   Variation ${i + 1}: ${img.filename}`)
    )
  }

  // 3. Variation mode - using array of images  
  console.log("\n3. Variation Mode - Array of Images")
  const variationResult2 = await generateImage("", {
    mode: "variation", 
    images: [generationResult.image], // Array format
    n: 1,
  })
  
  if (variationResult2.images) {
    console.log("✅ Generated variations (from array):")
    variationResult2.images.forEach((img, i) => 
      console.log(`   Variation ${i + 1}: ${img.filename}`)
    )
  }

  // 4. Edit mode - using single image
  console.log("\n4. Edit Mode - Single Image")
  const editResult = await generateImage("Replace the sunglasses with a red baseball cap", {
    mode: "edit",
    images: generationResult.image, // Single image
    n: 1,
  })
  
  if (editResult.images) {
    console.log("✅ Generated edited images (from single image):")
    editResult.images.forEach((img, i) => 
      console.log(`   Edit ${i + 1}: ${img.filename}`)
    )
    console.log("📝 Edit revised prompt:", editResult.revisedPrompt)
  }

  // 5. Edit mode - using array of images
  console.log("\n5. Edit Mode - Array of Images") 
  const editResult2 = await generateImage("Add a colorful Hawaiian shirt", {
    mode: "edit",
    images: [generationResult.image], // Array format
    n: 1,
  })
  
  if (editResult2.images) {
    console.log("✅ Generated edited images (from array):")
    editResult2.images.forEach((img, i) => 
      console.log(`   Edit ${i + 1}: ${img.filename}`)
    )
    console.log("📝 Edit revised prompt:", editResult2.revisedPrompt)
  }
}

console.log("\n🎉 Unified API with ElementOrArray support tested successfully!")
console.log("\n📊 API Summary:")
console.log("✅ First argument: ALWAYS the prompt (string)")
console.log("✅ Options object contains:")
console.log("   - mode: 'generation' | 'variation' | 'edit' (defaults to 'generation')")
console.log("   - images: ElementOrArray<string | WorkspaceFile> - supports single image or array")
console.log("   - Other generation parameters (n, quality, size, etc.)")
console.log("✅ Returns: { image?, images?, revisedPrompt? }")
console.log("\n💡 ElementOrArray allows both:")
console.log("   images: singleImage        // Single image")
console.log("   images: [img1, img2, ...]  // Array of images")
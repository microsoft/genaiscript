script({
  title: "Unified generateImage Function Demo",
  description: "Demonstrates the new unified generateImage function that supports generation, variation, and edit modes",
  model: "openai:gpt-image-1"
})

console.log("🎨 Unified generateImage Function Demo")
console.log("======================================")

// Mode 1: Generate from text prompt (original behavior)
console.log("\n📝 Mode 1: Generate from text prompt")
console.log("Usage: generateImage(prompt, options)")

try {
    const { image, revisedPrompt } = await generateImage("A cheerful orange cat sitting in a sunny garden")
    
    if (image) {
        console.log("✅ Generated image:", image.filename)
        console.log("🔄 Revised prompt:", revisedPrompt || "No revision")
        
        // Mode 2: Generate variation using the generated image
        console.log("\n🎲 Mode 2: Generate variation from image")
        console.log("Usage: generateImage(imageFile, options)")
        
        const { images: variations } = await generateImage(image, { n: 2 })
        console.log("✅ Generated variations:", variations?.length || 0)
        
        if (variations && variations.length > 0) {
            console.log("   Variation files:", variations.map(v => v.filename).join(", "))
            
            // Mode 3: Edit image with text prompt
            console.log("\n✏️ Mode 3: Edit image with text prompt")
            console.log("Usage: generateImage(imageFile, editPrompt, options)")
            
            const { images: edited, revisedPrompt: editRevised } = await generateImage(
                image, 
                "Add a red Santa hat on the cat's head",
                { n: 1 }
            )
            
            console.log("✅ Generated edits:", edited?.length || 0)
            console.log("🔄 Edit revised prompt:", editRevised || "No revision")
            
            if (edited && edited.length > 0) {
                console.log("   Edited files:", edited.map(e => e.filename).join(", "))
            }
        }
    }
} catch (error) {
    console.error("❌ Error:", error.message)
}

console.log("\n🎉 Demo completed!")
console.log("\n📖 Usage Summary:")
console.log("- generateImage(prompt) → { image, revisedPrompt }")
console.log("- generateImage(imageFile) → { images }")  
console.log("- generateImage(imageFile, editPrompt) → { images, revisedPrompt }")
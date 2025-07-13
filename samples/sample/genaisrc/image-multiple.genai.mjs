// Multiple image input example using generateImage 
const { output } = env;

// Test with multiple images
const robotsImage = await workspace.readFile("src/robots.jpg");
const poemFile = await workspace.readFile("poem.txt");

output.heading(2, "Multiple Image Input Example");
output.text("Creating a composite image using multiple inputs");

try {
  // For demonstration, we'll use the robots image twice
  // In a real scenario, you'd have different images
  const { image, revisedPrompt } = await generateImage(
    "Combine these images into a creative collage with a futuristic theme",
    [robotsImage, robotsImage], // Array of images
    {
      model: "openai:gpt-image-1",
      operation: "edit",
      size: "1024x1024",
      quality: "high"
    }
  );

  output.text("Generated composite image:");
  await output.image(image.filename);
  
  if (revisedPrompt) {
    output.fence("Revised prompt:\n" + revisedPrompt, "text");
  }
} catch (error) {
  output.text("Error: " + error.message);
}
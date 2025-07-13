// Image variations example using generateImage with input images
const { output } = env;

// Test image variations with the robots.jpg image
const robotsImage = await workspace.readFile("src/robots.jpg");

output.heading(2, "Image Variations Example");
output.text("Creating variations of the robots.jpg image");

try {
  const { image, revisedPrompt } = await generateImage(
    "Create a colorful artistic variation of this image",
    robotsImage,
    {
      model: "openai:gpt-image-1", // Use gpt-image-1 for image variations
      operation: "variations",
      size: "1024x1024",
      quality: "high"
    }
  );

  output.text("Generated variation:");
  await output.image(image.filename);
  
  if (revisedPrompt) {
    output.fence("Revised prompt:\n" + revisedPrompt, "text");
  }
} catch (error) {
  output.text("Error: " + error.message);
}
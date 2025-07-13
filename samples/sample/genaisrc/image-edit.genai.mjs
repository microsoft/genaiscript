// Image editing example using generateImage with input images
const { output } = env;

// Test image editing with the robots.jpg image
const robotsImage = await workspace.readFile("src/robots.jpg");

output.heading(2, "Image Edit Example");
output.text("Editing the robots.jpg image to create a banner");

try {
  const { image, revisedPrompt } = await generateImage(
    "Transform this image into a modern banner with a blue gradient background and professional typography",
    robotsImage,
    {
      model: "openai:gpt-image-1", // Use gpt-image-1 for image editing
      operation: "edit",
      size: "1792x1024", // Banner size
      quality: "high"
    }
  );

  output.text("Generated banner image:");
  await output.image(image.filename);
  
  if (revisedPrompt) {
    output.fence("Revised prompt:\n" + revisedPrompt, "text");
  }
} catch (error) {
  output.text("Error: " + error.message);
}
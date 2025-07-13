// Backwards compatibility test - ensure existing generateImage calls still work
const { output } = env;

output.heading(2, "Backwards Compatibility Test");
output.text("Testing that existing generateImage calls still work without modification");

// Test the original generateImage function without any image inputs
try {
  const { image, revisedPrompt } = await generateImage(
    "A cute robot cat with mechanical parts, cyberpunk style",
    {
      model: "openai:gpt-image-1",
      size: "1024x1024",
      quality: "high"
    }
  );

  output.text("Generated image (original API):");
  await output.image(image.filename);
  
  if (revisedPrompt) {
    output.fence("Revised prompt:\n" + revisedPrompt, "text");
  }
} catch (error) {
  output.text("Error: " + error.message);
}

// Test with different models for compatibility
for (const model of ["openai:dall-e-2", "openai:dall-e-3"]) {
  output.heading(3, `Testing ${model}`);
  try {
    const { image, revisedPrompt } = await generateImage(
      "A simple geometric pattern",
      {
        model,
        size: "512x512",
        quality: "auto"
      }
    );

    output.text(`Generated image with ${model}:`);
    await output.image(image.filename);
    
    if (revisedPrompt) {
      output.fence("Revised prompt:\n" + revisedPrompt, "text");
    }
  } catch (error) {
    output.text(`Error with ${model}: ` + error.message);
  }
}
// Integration test for generateImage with robots.jpg
const { output } = env;

// Test with the robots.jpg image
const robotsImage = await workspace.readFile("src/robots.jpg");

output.heading(2, "Integration Test: generateImage with robots.jpg");

// Test 1: Backward compatibility - original API should still work
output.heading(3, "Test 1: Backward Compatibility");
try {
  const result1 = await generateImage("A simple blue square", {
    model: "openai:gpt-image-1",
    size: "512x512",
    quality: "auto"
  });
  
  output.text("✅ Backward compatibility test passed");
  output.text(`Generated image: ${result1.image.filename}`);
} catch (error) {
  output.text("❌ Backward compatibility test failed: " + error.message);
}

// Test 2: Image editing operation
output.heading(3, "Test 2: Image Editing");
try {
  const result2 = await generateImage(
    "Add a blue border around this image",
    robotsImage,
    {
      model: "openai:gpt-image-1",
      operation: "edit",
      size: "1024x1024",
      quality: "high"
    }
  );
  
  output.text("✅ Image editing test passed");
  output.text(`Generated image: ${result2.image.filename}`);
  if (result2.revisedPrompt) {
    output.fence("Revised prompt: " + result2.revisedPrompt, "text");
  }
} catch (error) {
  output.text("❌ Image editing test failed: " + error.message);
}

// Test 3: Image variations operation
output.heading(3, "Test 3: Image Variations");
try {
  const result3 = await generateImage(
    "Create an artistic variation",
    robotsImage,
    {
      model: "openai:gpt-image-1",
      operation: "variations",
      size: "1024x1024",
      quality: "high"
    }
  );
  
  output.text("✅ Image variations test passed");
  output.text(`Generated image: ${result3.image.filename}`);
  if (result3.revisedPrompt) {
    output.fence("Revised prompt: " + result3.revisedPrompt, "text");
  }
} catch (error) {
  output.text("❌ Image variations test failed: " + error.message);
}

// Test 4: Multiple images
output.heading(3, "Test 4: Multiple Images");
try {
  const result4 = await generateImage(
    "Combine these images creatively",
    [robotsImage, robotsImage], // Using the same image twice for testing
    {
      model: "openai:gpt-image-1",
      operation: "edit",
      size: "1024x1024",
      quality: "high"
    }
  );
  
  output.text("✅ Multiple images test passed");
  output.text(`Generated image: ${result4.image.filename}`);
  if (result4.revisedPrompt) {
    output.fence("Revised prompt: " + result4.revisedPrompt, "text");
  }
} catch (error) {
  output.text("❌ Multiple images test failed: " + error.message);
}

// Test 5: Auto-operation detection
output.heading(3, "Test 5: Auto-operation Detection");
try {
  const result5 = await generateImage(
    "Make this image more colorful",
    robotsImage,
    {
      model: "openai:gpt-image-1",
      // No operation specified - should auto-detect as "edit"
      size: "1024x1024",
      quality: "high"
    }
  );
  
  output.text("✅ Auto-operation detection test passed");
  output.text(`Generated image: ${result5.image.filename}`);
  if (result5.revisedPrompt) {
    output.fence("Revised prompt: " + result5.revisedPrompt, "text");
  }
} catch (error) {
  output.text("❌ Auto-operation detection test failed: " + error.message);
}

output.heading(3, "Summary");
output.text("Integration tests completed. Check the results above for any failures.");